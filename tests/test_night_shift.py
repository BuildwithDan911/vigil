"""
test_night_shift.py - Phase 8 Night Shift Replay & Without Vigil Verification
"""
from vigil.night_shift import NightShiftEngine

def test_night_shift():
    engine = NightShiftEngine()
    report = engine.run_simulation()
    
    # 1. Planted cases caught: P01, P02, P15
    assert report.critical_caught_vigil == 3, f"Expected 3 critical caught, got {report.critical_caught_vigil}"
    
    # 2. Without Vigil lost count > 0
    assert report.without_vigil_lost_count == 3, f"Expected 3 lost in baseline, got {report.without_vigil_lost_count}"
    
    # 3. Escalations triggered
    assert report.escalations_triggered >= 1
    
    # 4. Consent holds applied
    assert report.consent_holds_applied == 2
    
    # 5. Split comparison structure
    split = engine.get_split_comparison()
    assert "with_vigil" in split
    assert "without_vigil" in split
    assert split["without_vigil"]["lost_patients_count"] == 3
    assert len(split["with_vigil"]["key_highlights"]) >= 3
    
    print("[PASS] Phase 8 Night Shift and Without Vigil verified.")

if __name__ == "__main__":
    test_night_shift()
