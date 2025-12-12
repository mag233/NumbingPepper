use base64::Engine;
use chrono::Utc;
use log::LevelFilter;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};
use tauri_plugin_log::Builder as LogBuilder;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use tauri_plugin_store::Builder as StoreBuilder;
use uuid::Uuid;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "create settings table",
      sql: "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 2,
      description: "create library table",
      sql: "CREATE TABLE IF NOT EXISTS library (id TEXT PRIMARY KEY, name TEXT NOT NULL, size INTEGER NOT NULL, path TEXT NOT NULL, added_at INTEGER NOT NULL)",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 3,
      description: "create books table",
      sql: "
        CREATE TABLE IF NOT EXISTS books (
          id TEXT PRIMARY KEY,
          title TEXT,
          author TEXT,
          cover_path TEXT,
          file_path TEXT NOT NULL,
          format TEXT NOT NULL,
          file_hash TEXT,
          file_size INTEGER NOT NULL,
          mtime INTEGER,
          last_read_position TEXT,
          processed_for_search INTEGER DEFAULT 0,
          added_at INTEGER NOT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_books_hash ON books(file_hash);
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 4,
      description: "create highlights table",
      sql: "
        CREATE TABLE IF NOT EXISTS highlights (
          id TEXT PRIMARY KEY,
          book_id TEXT NOT NULL,
          content TEXT NOT NULL,
          context_range TEXT NOT NULL,
          color TEXT NOT NULL,
          note TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
        );
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 5,
      description: "create chats table",
      sql: "
        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          reference_highlight_id TEXT,
          created_at INTEGER NOT NULL
        );
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 6,
      description: "create drafts table",
      sql: "
        CREATE TABLE IF NOT EXISTS drafts (
          id TEXT PRIMARY KEY,
          editor_doc TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 7,
      description: "create book_text_index table",
      sql: "
        CREATE VIRTUAL TABLE IF NOT EXISTS book_text_index
        USING fts5(book_id, chunk, chunk_id, page, created_at);
      ",
      kind: MigrationKind::Up,
    },
  ];

  tauri::Builder::default()
    .plugin(StoreBuilder::default().build())
    .plugin(
      SqlBuilder::new()
        .add_migrations("sqlite:settings.db", migrations)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![
      copy_to_library,
      copy_files_payload,
      read_file_base64,
      remove_path
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app
          .handle()
          .plugin(LogBuilder::default().level(LevelFilter::Info).build())?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[derive(Serialize)]
struct BookImportResult {
  id: String,
  file_name: String,
  file_path: String,
  file_hash: String,
  file_size: u64,
  mtime: i64,
  format: String,
  added_at: i64,
}

fn app_library_dir(app: &AppHandle) -> Result<PathBuf, String> {
  let resolver = app.path();
  let base_dir = resolver
    .app_data_dir()
    .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
  let library_dir = base_dir.join("library");
  fs::create_dir_all(&library_dir)
    .map_err(|e| format!("Failed to create library dir: {e}"))?;
  Ok(library_dir)
}

fn system_time_to_millis(time: SystemTime) -> i64 {
  time
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or_else(|_| Utc::now().timestamp_millis())
}

fn infer_format(path: &Path) -> String {
  path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_ascii_lowercase())
    .unwrap_or_else(|| "pdf".to_string())
}

#[tauri::command]
async fn copy_to_library(app: AppHandle, paths: Vec<String>) -> Result<Vec<BookImportResult>, String> {
  let library_dir = app_library_dir(&app)?;

  let mut entries = Vec::new();
  for source in paths {
    let src_path = Path::new(&source);
    let file_name = src_path
      .file_name()
      .ok_or_else(|| "Invalid file name".to_string())?;
    let format = infer_format(src_path);
    let id = Uuid::new_v4().to_string();
    let book_dir = library_dir.join(&id);
    fs::create_dir_all(&book_dir)
      .map_err(|e| format!("Failed to create book dir: {e}"))?;
    let dest_path: PathBuf = book_dir.join(format!("original.{}", format));

    let mut src_file = fs::File::open(&src_path)
      .map_err(|e| format!("Failed to open source file: {e}"))?;
    let mut dest_file = fs::File::create(&dest_path)
      .map_err(|e| format!("Failed to create destination file: {e}"))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];
    loop {
      let read = src_file
        .read(&mut buffer)
        .map_err(|e| format!("Failed to read source file: {e}"))?;
      if read == 0 {
        break;
      }
      hasher.update(&buffer[..read]);
      dest_file
        .write_all(&buffer[..read])
        .map_err(|e| format!("Failed to write destination file: {e}"))?;
    }
    dest_file
      .flush()
      .map_err(|e| format!("Failed to flush destination file: {e}"))?;

    let meta = fs::metadata(&dest_path)
      .map_err(|e| format!("Failed to read metadata: {e}"))?;
    let file_size = meta.len();
    let mtime = meta
      .modified()
      .map(system_time_to_millis)
      .unwrap_or_else(|_| Utc::now().timestamp_millis());
    let file_hash = format!("{:x}", hasher.finalize());
    let added_at = Utc::now().timestamp_millis();

    entries.push(BookImportResult {
      id,
      file_name: file_name.to_string_lossy().to_string(),
      file_path: dest_path.to_string_lossy().to_string(),
      file_hash,
      file_size,
      mtime,
      format,
      added_at,
    });
  }

  Ok(entries)
}

#[derive(Deserialize)]
struct FilePayload {
  name: String,
  data_base64: String,
}

#[tauri::command]
async fn copy_files_payload(app: AppHandle, files: Vec<FilePayload>) -> Result<Vec<BookImportResult>, String> {
  let library_dir = app_library_dir(&app)?;

  let mut entries = Vec::new();
  for file in files {
    let id = Uuid::new_v4().to_string();
    let format = infer_format(Path::new(&file.name));
    let book_dir = library_dir.join(&id);
    fs::create_dir_all(&book_dir)
      .map_err(|e| format!("Failed to create book dir: {e}"))?;
    let dest_path: PathBuf = book_dir.join(format!("original.{}", format));
    let data = base64::engine::general_purpose::STANDARD
      .decode(file.data_base64.as_bytes())
      .map_err(|e| format!("Failed to decode file data: {e}"))?;
    let file_hash = format!("{:x}", Sha256::digest(&data));
    fs::write(&dest_path, data).map_err(|e| format!("Failed to write file: {e}"))?;
    let meta = fs::metadata(&dest_path)
      .map_err(|e| format!("Failed to read metadata: {e}"))?;
    let file_size = meta.len();
    let mtime = meta
      .modified()
      .map(system_time_to_millis)
      .unwrap_or_else(|_| Utc::now().timestamp_millis());
    let added_at = Utc::now().timestamp_millis();

    entries.push(BookImportResult {
      id,
      file_name: file.name,
      file_path: dest_path.to_string_lossy().to_string(),
      file_hash,
      file_size,
      mtime,
      format,
      added_at,
    });
  }

  Ok(entries)
}

#[tauri::command]
async fn read_file_base64(path: String) -> Result<String, String> {
  let data = fs::read(&path).map_err(|e| format!("Failed to read file: {e}"))?;
  Ok(base64::engine::general_purpose::STANDARD.encode(data))
}

#[tauri::command]
async fn remove_path(path: String) -> Result<(), String> {
  let target = Path::new(&path);
  if target.is_file() {
    fs::remove_file(target).map_err(|e| format!("Failed to remove file: {e}"))?;
  } else if target.is_dir() {
    fs::remove_dir_all(target).map_err(|e| format!("Failed to remove directory: {e}"))?;
  }
  Ok(())
}
