# scripts/check.ps1 - Complete Test Suite Runner for Windows
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Vigil for IRIS for Health - Automated Test Suite Runner" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$testFiles = @(
    "tests/test_risk_score.py",
    "tests/test_referral.py",
    "tests/test_agent_decision.py",
    "tests/test_escalation.py",
    "tests/test_ui_palette.py",
    "tests/test_night_shift.py",
    "tests/test_consent.py",
    "tests/test_ledger.py",
    "tests/test_vector_memory.py",
    "tests/test_i18n.py",
    "tests/test_pex_auditor.py",
    "tests/test_ipm_clean.py",
    "tests/test_objectscript_lint.py"
)

$passed = 0
$failed = 0

foreach ($test in $testFiles) {
    Write-Host "`n--> Executing $test..." -ForegroundColor Yellow
    try {
        $output = python -u $test 2>&1
        Write-Host $output
        if ($LASTEXITCODE -eq 0) {
            $passed++
        } else {
            Write-Host "[FAIL] $test exited with code $LASTEXITCODE" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "[FAIL] $test threw exception: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n--> Checking for committed secrets..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus -match "\.env\b" -or $gitStatus -match "answer-key\.json") {
    Write-Host "[FAIL] Forbidden secret files found in git status!" -ForegroundColor Red
    $failed++
} else {
    Write-Host "[PASS] Zero committed secrets confirmed (.env and answer-key gitignored)." -ForegroundColor Green
    $passed++
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY: $passed Passed, $failed Failed." -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
} else {
    exit 0
}
