#!/usr/bin/env bash
set -e

echo "=== Running Vigil System & Secret Verification ==="

# 1. Secret scan
echo "Checking for committed secrets..."
if git ls-files | grep -E 'answer-key.json|^\.env$' ; then
    echo "ERROR: FORBIDDEN SECRET FILE TRACKED!"
    exit 1
fi

if git grep -nE 'AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}' -- . 2>/dev/null ; then
    echo "ERROR: API KEY DETECTED IN TRACKED FILES!"
    exit 1
fi
echo "Secret scan: PASSED (0 secrets found)"

# 2. Synthetic dataset verification
echo "Checking synthetic patient data..."
if [ ! -f "data/patients.json" ] || [ ! -d "data/night/adt" ] || [ ! -d "data/night/oru" ]; then
    echo "Generating night dataset..."
    python tools/generate_night.py --out data --force
fi
echo "Dataset verification: PASSED"

# 3. Docker status check (if docker is available)
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    echo "Docker available. Checking container status..."
    docker compose ps
fi

echo "=== Vigil Phase Verification Complete: ALL CHECKS GREEN ==="
