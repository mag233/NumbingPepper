use log::LevelFilter;
use tauri_plugin_log::Builder as LogBuilder;
use tauri_plugin_sql::Builder as SqlBuilder;
use tauri_plugin_store::Builder as StoreBuilder;

mod commands;
mod migrations;
mod paths;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(StoreBuilder::default().build())
    .plugin(
      SqlBuilder::new()
        .add_migrations("sqlite:settings.db", migrations::migrations())
        .build(),
    )
    .invoke_handler(tauri::generate_handler![
      commands::copy_to_library,
      commands::copy_files_payload,
      commands::read_file_base64,
      commands::remove_path,
      commands::hash_file
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
