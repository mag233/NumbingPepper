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
    Migration {
      version: 10,
      description: "create writing_projects table",
      sql: "
        CREATE TABLE IF NOT EXISTS writing_projects (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_writing_projects_updated_at ON writing_projects(updated_at);
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 11,
      description: "create writing_contents table",
      sql: "
        CREATE TABLE IF NOT EXISTS writing_contents (
          project_id TEXT PRIMARY KEY,
          content_text TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(project_id) REFERENCES writing_projects(id) ON DELETE CASCADE
        );
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 12,
      description: "create writing_contexts table",
      sql: "
        CREATE TABLE IF NOT EXISTS writing_contexts (
          project_id TEXT PRIMARY KEY,
          context_text TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(project_id) REFERENCES writing_projects(id) ON DELETE CASCADE
        );
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 13,
      description: "create writing_references table",
      sql: "
        CREATE TABLE IF NOT EXISTS writing_references (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          source_type TEXT NOT NULL,
          book_id TEXT,
          page_index INTEGER,
          rects_json TEXT,
          title TEXT,
          author TEXT,
          snippet_text TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY(project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
          FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_writing_refs_project_id ON writing_references(project_id);
        CREATE INDEX IF NOT EXISTS idx_writing_refs_book_id ON writing_references(book_id);
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 14,
      description: "create writing_context_membership table",
      sql: "
        CREATE TABLE IF NOT EXISTS writing_context_membership (
          project_id TEXT NOT NULL,
          reference_id TEXT NOT NULL,
          included INTEGER NOT NULL DEFAULT 0,
          order_index INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY(project_id, reference_id),
          FOREIGN KEY(project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
          FOREIGN KEY(reference_id) REFERENCES writing_references(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_writing_ctx_membership_project_id ON writing_context_membership(project_id);
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 15,
      description: "create writing_artifacts table",
      sql: "
        CREATE TABLE IF NOT EXISTS writing_artifacts (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          artifact_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content_text TEXT NOT NULL,
          scope_json TEXT NOT NULL,
          input_snapshot_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(project_id) REFERENCES writing_projects(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_writing_artifacts_project_id ON writing_artifacts(project_id);
        CREATE INDEX IF NOT EXISTS idx_writing_artifacts_updated_at ON writing_artifacts(updated_at);
      ",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 16,
      description: "create bookmarks table",
      sql: "
        CREATE TABLE IF NOT EXISTS bookmarks (
          id TEXT PRIMARY KEY,
          book_id TEXT NOT NULL,
          page INTEGER NOT NULL,
          page_label TEXT,
          title TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks(book_id);
        CREATE INDEX IF NOT EXISTS idx_bookmarks_page ON bookmarks(book_id, page);
      ",
      kind: MigrationKind::Up,
    },
  ]
}
