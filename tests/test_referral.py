"""
Test suite for Vigil Referral Leakage Engine (Phase 4 Done-when Verification)
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "python")))
from vigil.referral_engine import evaluate_referral

def run_referral_tests():
    print("=== Executing Phase 4 Referral Leakage Verification ===")
    
    # Load planted files
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "night", "referral"))
    
    with open(os.path.join(data_dir, "R01.json")) as f:
        r01 = json.load(f)
    with open(os.path.join(data_dir, "R02.json")) as f:
        r02 = json.load(f)
    with open(os.path.join(data_dir, "R03.json")) as f:
        r03 = json.load(f)
    with open(os.path.join(data_dir, "R04.json")) as f:
        r04 = json.load(f)

    # R01: Oncology unbooked -> must open loop (action: chase)
    res01 = evaluate_referral(r01)
    assert res01["opens_loop"] is True, f"R01 expected to open loop, got {res01}"
    assert res01["referral_action"] == "chase"
    print("[PASS] R01 opens loop for unbooked oncology referral (action: chase)")

    # R02: Orthopaedics booked -> must NOT open loop
    res02 = evaluate_referral(r02)
    assert res02["opens_loop"] is False, f"R02 should NOT open loop, got {res02}"
    print("[PASS] R02 booked referral does NOT open loop")

    # R03: Cardiology unbooked -> must open loop (action: chase)
    res03 = evaluate_referral(r03)
    assert res03["opens_loop"] is True, f"R03 expected to open loop, got {res03}"
    assert res03["referral_action"] == "chase"
    print("[PASS] R03 opens loop for unbooked cardiology referral")

    # R04: Psychiatry unbooked with SMS opt-out -> opens loop with hold
    res04 = evaluate_referral(r04)
    assert res04["opens_loop"] is True, f"R04 expected to open loop, got {res04}"
    assert r04["share_results_sms"] is False, "R04 must have SMS opt-out (consent hold)"
    print("[PASS] R04 opens loop with SMS opt-out (consent hold)")

    print("=== ALL PHASE 4 REFERRAL TESTS PASSED CLEANLY ===")

if __name__ == "__main__":
    run_referral_tests()
