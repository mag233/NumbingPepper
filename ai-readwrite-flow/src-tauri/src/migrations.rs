use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migrations() -> Vec<Migration> {
  vec![
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
    Migration {
      version: 8,
      description: "add books.last_opened_at",
      sql: "
        ALTER TABLE books ADD COLUMN last_opened_at INTEGER;
        CREATE INDEX IF NOT EXISTS idx_books_last_opened ON books(last_opened_at);
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 9,
      description: "add books.deleted_at",
      sql: "
        ALTER TABLE books ADD COLUMN deleted_at INTEGER;
        CREATE INDEX IF NOT EXISTS idx_books_deleted_at ON books(deleted_at);
      ",
      kind: MigrationKind::Up,
    },
  ]
}
