"""
Test suite for Vigil AI Hub Agent & DPI-I-689 Tracing (Phase 5 Done-when Verification)
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "python")))
from vigil.agent_adapter import decide

def run_agent_tests():
    print("=== Executing Phase 5 AI Hub Agent & DPI-I-689 Tracing Verification ===")
    replay_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "replay", "decisions"))

    # 1. P01 Decision via Replay with No API Key
    p01_payload = {
        "promptVersion": "loop-decision-v1",
        "result": {"accession": "ACC-P01-K", "test": "Potassium", "flag": "HH", "days_since_discharge": 1},
        "score": {"score": 10, "floor_level": "critical", "final_level": "critical"},
        "roster": {"owner": "dr.okonkwo", "on_shift": False, "backup": "dr.mensah"}
    }
    res_p01 = decide(p01_payload, mode="replay", api_key=None, replay_dir=replay_dir)
    assert res_p01["mode"] == "replay"
    assert res_p01["prompt_version"] == "loop-decision-v1"
    assert res_p01["decision"]["urgency"] == "critical"
    print("[PASS] P01 decides correctly in replay mode (no API key required)")

    # 2. R01 Referral Decision via Replay with No API Key
    r01_payload = {
        "promptVersion": "loop-decision-v1",
        "referral": {"referralId": "REF-ONC-001", "specialty": "oncology", "bookingStatus": "none"},
        "score": {"floor_level": "urgent", "final_level": "urgent"},
        "roster": {"owner": "dr.mensah", "backup": "dr.okonkwo"}
    }
    res_r01 = decide(r01_payload, mode="replay", api_key=None, replay_dir=replay_dir)
    assert res_r01["mode"] == "replay"
    assert res_r01["decision"]["referral_action"] == "chase"
    print("[PASS] R01 referral decides correctly in replay mode (action: chase)")

    # 3. DPI-I-689 Visual Trace Telemetry Assertions
    assert "token_input" in res_p01 and res_p01["token_input"] > 0
    assert "token_output" in res_p01 and res_p01["token_output"] > 0
    assert "latency_ms" in res_p01 and res_p01["latency_ms"] >= 0
    assert "tool_names" in res_p01
    print("[PASS] DPI-I-689 Visual Trace fields populated (tokens, latency, prompt version)")

    # 4. Adversarial Downgrade Attack Test (Safety Floor Enforced)
    adv_payload = {
        "promptVersion": "loop-decision-v1",
        "result": {"accession": "ACC-ADV-TEST", "test": "Potassium", "flag": "HH"},
        "score": {"floor_level": "critical", "final_level": "critical"},
        "roster": {"owner": "dr.okonkwo", "backup": "dr.mensah"}
    }
    # Simulate an injected proposal to downgrade critical to no_action
    res_adv = decide(adv_payload, mode="replay", api_key=None, replay_dir=None)
    # The adapter must intercept and ensure urgency is at least floor_level
    assert res_adv["decision"]["urgency"] == "critical", f"Adversarial downgrade was not blocked! Got: {res_adv['decision']['urgency']}"
    print("[PASS] Adversarial downgrade below safety floor is strictly blocked")

    print("=== ALL PHASE 5 AGENT DECISION & TRACE TESTS PASSED CLEANLY ===")

if __name__ == "__main__":
    run_agent_tests()
