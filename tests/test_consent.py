"""
test_consent.py - Phase 9 Consent Gate and Review Queue Verification
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "python"))

from vigil.consent import ConsentGate

def test_consent_gate():
    gate = ConsentGate()
    
    # 1. Test P09 (HIV - share_sensitive is false) -> strictly REDACT
    dec_p09 = gate.evaluate(
        patient_id="P09",
        test_codes=["HIVVL"],
        test_name="HIV-1 RNA Viral Load",
        raw_script="Martha Reeve HIV-1 Viral Load is Detectable at 45,000 copies/mL."
    )
    assert dec_p09.decision == "redact", f"Expected redact, got {dec_p09.decision}"
    assert "HIV" not in dec_p09.outbound_message, "Outbound message must not contain HIV"
    assert "45,000" not in dec_p09.outbound_message, "Outbound message must not contain viral load value"
    assert "0800-427-268" in dec_p09.outbound_message
    assert "hiv" in dec_p09.matched_labels
    
    # 2. Test P10 (Lithium / Mental Health - share_results_sms is false) -> strictly HOLD
    dec_p10 = gate.evaluate(
        patient_id="P10",
        test_codes=["LITH"],
        test_name="Lithium Level",
        raw_script="Yusuf Bello Lithium level is 2.1 mmol/L."
    )
    assert dec_p10.decision == "hold", f"Expected hold, got {dec_p10.decision}"
    assert "HOLD" in dec_p10.outbound_message
    assert "mental_health" in dec_p10.matched_labels
    
    # 3. Test Ordinary Case (P01 Potassium) -> strictly SEND
    dec_p01 = gate.evaluate(
        patient_id="P01",
        test_codes=["POTASSIUM"],
        test_name="Potassium Serum",
        raw_script="Martha Reeve Potassium result is ready."
    )
    assert dec_p01.decision == "send", f"Expected send, got {dec_p01.decision}"
    assert dec_p01.outbound_message == "Martha Reeve Potassium result is ready."
    assert len(dec_p01.matched_labels) == 0
    
    print("[PASS] Phase 9 Consent Gate rules and redaction verified.")

if __name__ == "__main__":
    test_consent_gate()
