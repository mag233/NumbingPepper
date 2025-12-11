use log::LevelFilter;
use tauri_plugin_log::Builder as LogBuilder;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use tauri_plugin_store::Builder as StoreBuilder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create settings table",
    sql: "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(StoreBuilder::default().build())
    .plugin(
      SqlBuilder::new()
        .add_migrations("sqlite:settings.db", migrations)
        .build(),
    )
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
