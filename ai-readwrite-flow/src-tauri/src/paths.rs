use chrono::Utc;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::AppHandle;
use tauri::Manager;

pub fn app_library_dir(app: &AppHandle) -> Result<PathBuf, String> {
  let resolver = app.path();
  let base_dir = resolver
    .app_data_dir()
    .map_err(|e| format!("Failed to resolve app data dir: {e}"))?;
  let library_dir = base_dir.join("library");
  fs::create_dir_all(&library_dir)
    .map_err(|e| format!("Failed to create library dir: {e}"))?;
  Ok(library_dir)
}

pub fn infer_format(path: &Path) -> String {
  path
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| ext.to_ascii_lowercase())
    .unwrap_or_else(|| "pdf".to_string())
}

pub fn system_time_to_millis(time: SystemTime) -> i64 {
  time
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or_else(|_| Utc::now().timestamp_millis())
}
