"""
Test suite for Vigil Workflow & Escalation Clock (Phase 6 Done-when Verification)
"""

import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "python")))
from vigil.escalation import evaluate_loop_escalation, accept_loop_ownership

def run_escalation_tests():
    print("=== Executing Phase 6 Workflow & Escalation Clock Verification ===")

    # 1. Test P01 Escalation Ladder (Critical 2h deadline miss)
    opened_time = datetime(2026, 11, 4, 19, 0)
    p01_loop = {
        "loop_id": "VGL-01-REEVE",
        "urgency": "critical",
        "state": "Opened",
        "owner": "dr.okonkwo",
        "escalation_count": 0,
        "deadline": (opened_time + timedelta(hours=2)).isoformat() # Deadline 21:00
    }

    # Step A: At 20:00 (1 hour in), SLA is not breached
    check_2000 = evaluate_loop_escalation(p01_loop, datetime(2026, 11, 4, 20, 0))
    assert check_2000["escalated"] is False
    print("[PASS] P01 does not escalate before deadline (1h in)")

    # Step B: At 21:15 (2h 15m in), SLA is breached -> Escalates to Backup dr.mensah
    check_2115 = evaluate_loop_escalation(p01_loop, datetime(2026, 11, 4, 21, 15))
    assert check_2115["escalated"] is True
    assert check_2115["new_owner"] == "dr.mensah"
    assert check_2115["escalation_count"] == 1
    print("[PASS] P01 escalates to backup owner dr.mensah after 2h SLA miss")

    # Step C: At 23:30 (another 2h+ pass without action), escalates to Department Head dr.adewale
    escalated_p01 = check_2115["loop"]
    check_2330 = evaluate_loop_escalation(escalated_p01, datetime(2026, 11, 4, 23, 30))
    assert check_2330["escalated"] is True
    assert check_2330["new_owner"] == "dr.adewale"
    assert check_2330["escalation_count"] == 2
    print("[PASS] P01 escalates to Department Head dr.adewale after second SLA miss")

    # 2. Test Accept Ownership Action
    accepted = accept_loop_ownership(p01_loop, "dr.mensah")
    assert accepted["state"] == "Owned"
    assert accepted["owner"] == "dr.mensah"
    print("[PASS] Clinician accept action transitions state to 'Owned'")

    # 3. Test Routine SLA (24h) does not escalate in night shift
    routine_loop = {
        "loop_id": "VGL-04-COLE",
        "urgency": "routine",
        "state": "Opened",
        "owner": "dr.okonkwo",
        "deadline": (opened_time + timedelta(hours=24)).isoformat()
    }
    check_routine = evaluate_loop_escalation(routine_loop, datetime(2026, 11, 4, 23, 30))
    assert check_routine["escalated"] is False
    print("[PASS] Routine loop (24h SLA) does not escalate during night shift")

    print("=== ALL PHASE 6 ESCALATION & WORKFLOW TESTS PASSED CLEANLY ===")

if __name__ == "__main__":
    run_escalation_tests()
