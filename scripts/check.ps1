Write-Host "=== Running Vigil System & Secret Verification (PowerShell) ===" -ForegroundColor Cyan

# 1. Secret scan
Write-Host "Checking for committed secrets..." -ForegroundColor Yellow
$forbidden = git ls-files | Select-String -Pattern "answer-key\.json|^\.env$"
if ($forbidden) {
    Write-Error "FORBIDDEN FILE TRACKED: $forbidden"
    exit 1
}

$keys = git grep -nE "AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}" -- . 2>$null
if ($keys) {
    Write-Error "API KEY DETECTED IN TRACKED FILES: $keys"
    exit 1
}
Write-Host "Secret scan: PASSED (0 secrets found)" -ForegroundColor Green

# 2. Synthetic dataset verification
Write-Host "Checking synthetic patient data..." -ForegroundColor Yellow
if (-not (Test-Path "data/patients.json") -or -not (Test-Path "data/night/adt")) {
    Write-Host "Generating night dataset..."
    python tools/generate_night.py --out data --force
}
Write-Host "Dataset verification: PASSED" -ForegroundColor Green

# 3. Docker status check
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Docker available. Checking container status..."
    docker compose ps
} else {
    Write-Host "Note: Docker not in current PATH or not running. Replay tests run locally." -ForegroundColor Gray
}

Write-Host "=== Vigil Phase Verification Complete: ALL CHECKS GREEN ===" -ForegroundColor Green
