param(
  [switch]$All
)

$ErrorActionPreference = "Stop"

function Remove-IfExists([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  Remove-Item -Recurse -Force $Path
}

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Cleaning JS build artifacts..." -ForegroundColor Cyan
Remove-IfExists (Join-Path $repoRoot "dist")

Write-Host "Cleaning Rust build artifacts..." -ForegroundColor Cyan
# Always remove in-repo target (may exist from runs before CARGO_TARGET_DIR was set).
Remove-IfExists (Join-Path $repoRoot "src-tauri\\target")

Push-Location (Join-Path $repoRoot "src-tauri")
try {
  cargo clean | Out-Host
} finally {
  Pop-Location
}

if ($All) {
  Write-Host "Cleaning Node modules (slow to restore)..." -ForegroundColor Yellow
  Remove-IfExists (Join-Path $repoRoot "node_modules")
  Remove-IfExists (Join-Path $repoRoot "package-lock.json")
}

Write-Host "Done." -ForegroundColor Green
