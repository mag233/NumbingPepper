use crate::paths::{app_library_dir, infer_format, system_time_to_millis};
use base64::Engine;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use uuid::Uuid;

#[derive(Serialize)]
pub struct BookImportResult {
  pub id: String,
  pub file_name: String,
  pub file_path: String,
  pub file_hash: String,
  pub file_size: u64,
  pub mtime: i64,
  pub format: String,
  pub added_at: i64,
}

#[derive(Serialize)]
pub struct FileHashResult {
  pub file_name: String,
  pub file_hash: String,
  pub file_size: u64,
  pub mtime: i64,
  pub format: String,
}

fn hash_file_and_meta(src_path: &Path) -> Result<FileHashResult, String> {
  let file_name = src_path
    .file_name()
    .ok_or_else(|| "Invalid file name".to_string())?;
  let format = infer_format(src_path);
  let mut file = fs::File::open(src_path).map_err(|e| format!("Failed to open file: {e}"))?;

  let mut hasher = Sha256::new();
  let mut buffer = [0u8; 8192];
  loop {
    let read = file
      .read(&mut buffer)
      .map_err(|e| format!("Failed to read file: {e}"))?;
    if read == 0 {
      break;
    }
    hasher.update(&buffer[..read]);
  }

  let meta = fs::metadata(src_path).map_err(|e| format!("Failed to read metadata: {e}"))?;
  let file_size = meta.len();
  let mtime = meta
    .modified()
    .map(system_time_to_millis)
    .unwrap_or_else(|_| Utc::now().timestamp_millis());
  let file_hash = format!("{:x}", hasher.finalize());

  Ok(FileHashResult {
    file_name: file_name.to_string_lossy().to_string(),
    file_hash,
    file_size,
    mtime,
    format,
  })
}

#[tauri::command]
pub async fn hash_file(path: String) -> Result<FileHashResult, String> {
  hash_file_and_meta(Path::new(&path))
}

#[tauri::command]
pub async fn copy_to_library(app: AppHandle, paths: Vec<String>) -> Result<Vec<BookImportResult>, String> {
  let library_dir = app_library_dir(&app)?;

  let mut entries = Vec::new();
  for source in paths {
    let src_path = Path::new(&source);
    let hash = hash_file_and_meta(src_path)?;
    let id = Uuid::new_v4().to_string();
    let book_dir = library_dir.join(&id);
    fs::create_dir_all(&book_dir)
      .map_err(|e| format!("Failed to create book dir: {e}"))?;
    let dest_path: PathBuf = book_dir.join(format!("original.{}", hash.format));

    let mut src_file = fs::File::open(&src_path)
      .map_err(|e| format!("Failed to open source file: {e}"))?;
    let mut dest_file = fs::File::create(&dest_path)
      .map_err(|e| format!("Failed to create destination file: {e}"))?;
    std::io::copy(&mut src_file, &mut dest_file)
      .map_err(|e| format!("Failed to copy file: {e}"))?;
    dest_file
      .flush()
      .map_err(|e| format!("Failed to flush destination file: {e}"))?;

    let added_at = Utc::now().timestamp_millis();

    entries.push(BookImportResult {
      id,
      file_name: hash.file_name,
      file_path: dest_path.to_string_lossy().to_string(),
      file_hash: hash.file_hash,
      file_size: hash.file_size,
      mtime: hash.mtime,
      format: hash.format,
      added_at,
    });
  }

  Ok(entries)
}

#[derive(Deserialize)]
pub struct FilePayload {
  name: String,
  data_base64: String,
}

#[tauri::command]
pub async fn copy_files_payload(app: AppHandle, files: Vec<FilePayload>) -> Result<Vec<BookImportResult>, String> {
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
pub async fn read_file_base64(path: String) -> Result<String, String> {
  let data = fs::read(&path).map_err(|e| format!("Failed to read file: {e}"))?;
  Ok(base64::engine::general_purpose::STANDARD.encode(data))
}

#[tauri::command]
pub async fn remove_path(path: String) -> Result<(), String> {
  let target = Path::new(&path);
  if target.is_file() {
    fs::remove_file(target).map_err(|e| format!("Failed to remove file: {e}"))?;
    return Ok(());
  }
  if target.is_dir() {
    fs::remove_dir_all(target).map_err(|e| format!("Failed to remove directory: {e}"))?;
    return Ok(());
  }
  Ok(())
}
