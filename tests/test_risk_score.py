"""
Test suite for Vigil Risk Score & Safety Floor (Phase 3 Done-when Verification)
"""

import sys
import os
from datetime import datetime, date

# Add python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "python")))
from vigil.risk_score import calculate_risk, level_index

def test_p01_critical():
    """P01: Martha Reeve, 78, lives alone, K 6.8 HH, 1 day after discharge -> critical"""
    res = calculate_risk(
        observations=[{"flag": "HH", "numeric_value": 6.8, "ref_range": "3.5-5.0"}],
        discharge_dt=datetime(2026, 11, 4, 10, 0),
        result_dt=datetime(2026, 11, 5, 21, 14),
        age=78,
        lives_alone=True,
        owner="dr.okonkwo"
    )
    assert not res["skip"], "P01 should not be skipped"
    assert res["final_level"] == "critical", f"P01 expected critical, got {res['final_level']}"
    assert res["floor_level"] == "critical", "Safety floor for HH with vuln >= 2 and days <= 1 must be critical"
    print("[PASS] P01 Critical check passed")

def test_p02_critical():
    """P02: Samuel Okai, 67, troponin 2.4 HH, day of discharge -> critical"""
    res = calculate_risk(
        observations=[{"flag": "HH", "numeric_value": 2.4, "ref_range": "<0.04"}],
        discharge_dt=datetime(2026, 11, 4, 14, 0),
        result_dt=datetime(2026, 11, 4, 19, 30),
        age=67,
        lives_alone=False,
        owner="dr.okonkwo"
    )
    assert not res["skip"]
    assert res["final_level"] == "critical", f"P02 expected critical, got {res['final_level']}"
    print("[PASS] P02 Critical check passed")

def test_p15_multi_obx_critical():
    """P15: Multi-OBX normal CBC plus HH potassium -> critical (max flag wins)"""
    res = calculate_risk(
        observations=[
            {"flag": "N", "numeric_value": 14.2, "ref_range": "12.0-16.0"}, # Normal Hb
            {"flag": "N", "numeric_value": 6.5, "ref_range": "4.0-11.0"},   # Normal WBC
            {"flag": "HH", "numeric_value": 6.9, "ref_range": "3.5-5.0"}   # Critical K+
        ],
        discharge_dt=datetime(2026, 11, 4, 11, 0),
        result_dt=datetime(2026, 11, 5, 8, 0),
        age=70,
        lives_alone=False,
        owner="dr.okonkwo"
    )
    assert not res["skip"]
    assert res["final_level"] == "critical", f"P15 expected critical, got {res['final_level']}"
    print("[PASS] P15 Multi-OBX max flag critical passed")

def test_p05_no_action():
    """P05: Leah Nkrumah, 29, CBC normal N, 2 days after -> no_action / no loop"""
    res = calculate_risk(
        observations=[{"flag": "N", "numeric_value": 13.5, "ref_range": "12.0-15.5"}],
        discharge_dt=datetime(2026, 11, 2, 10, 0),
        result_dt=datetime(2026, 11, 4, 20, 0),
        age=29,
        lives_alone=False,
        owner="dr.okonkwo"
    )
    assert not res["skip"]
    assert res["final_level"] == "no_action", f"P05 expected no_action, got {res['final_level']}"
    print("[PASS] P05 Normal result no_action passed")

def test_p06_inpatient_skip():
    """P06: Inpatient result only (discharge_dt is None) -> skip (not_discharged)"""
    res = calculate_risk(
        observations=[{"flag": "HH", "numeric_value": 7.1}],
        discharge_dt=None,
        result_dt=datetime(2026, 11, 4, 22, 0),
        age=65,
        lives_alone=False
    )
    assert res["skip"] is True
    assert res["reason"] == "not_discharged"
    print("[PASS] P06 Inpatient skip passed")

def test_p07_result_before_discharge_skip():
    """P07: Result timestamp before discharge -> skip (result_before_discharge)"""
    res = calculate_risk(
        observations=[{"flag": "H", "numeric_value": 145}],
        discharge_dt=datetime(2026, 11, 5, 12, 0),
        result_dt=datetime(2026, 11, 4, 18, 0),
        age=50,
        lives_alone=False
    )
    assert res["skip"] is True
    assert res["reason"] == "result_before_discharge"
    print("[PASS] P07 Result before discharge skip passed")

def test_p12_floor_at_least_urgent():
    """P12: HH potassium, age 22, on shift, 3 weeks later -> floor forces >= urgent"""
    res = calculate_risk(
        observations=[{"flag": "HH", "numeric_value": 6.1}],
        discharge_dt=datetime(2026, 10, 14, 10, 0),
        result_dt=datetime(2026, 11, 4, 10, 0), # 21 days later
        age=22,
        lives_alone=False,
        owner="dr.okonkwo"
    )
    assert not res["skip"]
    assert level_index(res["final_level"]) >= level_index("urgent"), f"P12 floor must be >= urgent, got {res['final_level']}"
    print("[PASS] P12 Safety floor >= urgent passed")

def run_all_tests():
    print("=== Executing Phase 3 Risk Score Fixture Verification ===")
    test_p01_critical()
    test_p02_critical()
    test_p15_multi_obx_critical()
    test_p05_no_action()
    test_p06_inpatient_skip()
    test_p07_result_before_discharge_skip()
    test_p12_floor_at_least_urgent()
    print("=== ALL 7 PHASE 3 FIXTURE TESTS PASSED CLEANLY ===")

if __name__ == "__main__":
    run_all_tests()
