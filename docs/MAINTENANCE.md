# Maintenance (Dev Workspace)

## Why the repo can grow to 8GB+
- `ai-readwrite-flow/src-tauri/target/` is Rust/Cargo build output (incremental compilation + dependency artifacts).
- It is safe to delete; it will be regenerated on the next `tauri dev` / `cargo` build.

## One-shot cleanup
- Clean build artifacts (safe): `cd ai-readwrite-flow; cmd /c npm run clean`
- Clean everything including `node_modules` (slow to restore): `cd ai-readwrite-flow; cmd /c npm run clean:all`

## Keep Cargo build cache out of the repo (recommended)
On Windows, Tauri/Rust builds can create multiple GB of artifacts. You can move the Cargo target directory out of `ai-readwrite-flow/src-tauri/target` by setting `CARGO_TARGET_DIR`.

### Set to a folder on D: drive (example)
1) Create a folder (optional, but recommended):
- `mkdir D:\DevCache\cargo-target\ai-readwrite-flow`

2) Set the env var (persists for your user account):
- `setx CARGO_TARGET_DIR "D:\DevCache\cargo-target\ai-readwrite-flow"`

3) Important: **restart the terminal / VS Code** (because `setx` does not affect already-running shells).

4) Verify the value in the shell you use to run Tauri:
- PowerShell: `$env:CARGO_TARGET_DIR`
- CMD: `echo %CARGO_TARGET_DIR%`

If it prints empty (or in CMD prints `%CARGO_TARGET_DIR%` literally), the current shell session does not have the env var yet.

### Temporary (current-terminal-only) override
If you don't want to restart, set it for the current PowerShell session:
- `$env:CARGO_TARGET_DIR = "D:\DevCache\cargo-target\ai-readwrite-flow"`

## Scheduled cleanup (Windows Task Scheduler)
Goal: avoid `src-tauri/target` growing indefinitely on a dev machine.

1) Pick a schedule (example: weekly at 3:00 AM).
2) Create a task:
- Open Task Scheduler and create a task.
- Triggers: Weekly
- Actions: Start a program
  - Program/script: `powershell.exe`
  - Arguments:
    - `-NoProfile -ExecutionPolicy Bypass -File "<repo-root>\ai-readwrite-flow\scripts\cleanup-dev.ps1"`
  - Start in:
    - `<repo-root>\ai-readwrite-flow`

Tip: only enable `clean:all` if you explicitly want to delete `node_modules`.

