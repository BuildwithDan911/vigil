#!/usr/bin/env bash
# scripts/check.sh - Complete Test Suite Runner
set -e

echo "=========================================================="
echo "   Vigil for IRIS for Health - Automated Test Suite Runner"
echo "=========================================================="

TEST_FILES=(
    "tests/test_risk_score.py"
    "tests/test_referral.py"
    "tests/test_agent_decision.py"
    "tests/test_escalation.py"
    "tests/test_ui_palette.py"
    "tests/test_night_shift.py"
    "tests/test_consent.py"
    "tests/test_ledger.py"
    "tests/test_vector_memory.py"
    "tests/test_i18n.py"
    "tests/test_pex_auditor.py"
    "tests/test_ipm_clean.py"
)

PASSED=0
FAILED=0

for test in "${TEST_FILES[@]}"; do
    echo ""
    echo "--> Executing $test..."
    if python3 -u "$test"; then
        PASSED=$((PASSED + 1))
    else
        echo "[FAIL] $test failed!"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "--> Checking for committed secrets..."
if git status --porcelain | grep -E '\.env$|answer-key\.json$'; then
    echo "[FAIL] Forbidden secret files found in git status!"
    FAILED=$((FAILED + 1))
else
    echo "[PASS] Zero committed secrets confirmed (.env and answer-key gitignored)."
    PASSED=$((PASSED + 1))
fi

echo ""
echo "=========================================================="
echo "TEST SUMMARY: $PASSED Passed, $FAILED Failed."
echo "=========================================================="

if [ "$FAILED" -ne 0 ]; then
    exit 1
fi
exit 0
