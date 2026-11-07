"""
consent.py - Consent Gate Policy Evaluation and Redaction Engine
(c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
"""
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

SENSITIVE_CODE_MAP = {
    "hiv": ["HIVVL", "HIVRNA", "HIVAB", "CD4"],
    "mental_health": ["LI", "LITH", "PHQ", "GAD7"],
    "sexual_health": ["BHCG", "GC", "CHLAM"],
    "substance_use": ["TOX", "UDS"]
}

@dataclass
class PatientConsentRecord:
    patient_id: str
    share_results_sms: bool = True
    share_sensitive: bool = True
    preferred_language: str = "en"

@dataclass
class ConsentDecision:
    decision: str  # "send", "redact", "hold"
    matched_labels: List[str]
    outbound_message: str
    internal_call_script: str
    audit_fingerprint: str

class ConsentGate:
    def __init__(self, patient_consents: Optional[Dict[str, PatientConsentRecord]] = None):
        # Default planted records: P09 (HIV viral load redact), P10 (Lithium mental health hold)
        self.records: Dict[str, PatientConsentRecord] = patient_consents or {
            "P09": PatientConsentRecord(patient_id="P09", share_results_sms=True, share_sensitive=False),
            "P10": PatientConsentRecord(patient_id="P10", share_results_sms=False, share_sensitive=False)
        }

    def detect_sensitivity(self, test_codes: List[str]) -> List[str]:
        labels = []
        for code in test_codes:
            code_upper = code.upper()
            for label, substrings in SENSITIVE_CODE_MAP.items():
                for sub in substrings:
                    if sub in code_upper:
                        if label not in labels:
                            labels.append(label)
        return labels

    def evaluate(self, patient_id: str, test_codes: List[str], test_name: str, raw_script: str) -> ConsentDecision:
        pref = self.records.get(patient_id, PatientConsentRecord(patient_id=patient_id))
        labels = self.detect_sensitivity(test_codes)

        # 1. share_results_sms is false -> strictly HOLD
        if not pref.share_results_sms:
            return ConsentDecision(
                decision="hold",
                matched_labels=labels,
                outbound_message="[HOLD: Patient opted out of SMS notifications. Internal clinical phone call required.]",
                internal_call_script=raw_script,
                audit_fingerprint=f"HOLD|SMS_OPTOUT|{patient_id}"
            )

        # 2. Sensitive content and share_sensitive is false -> strictly REDACT
        if labels and not pref.share_sensitive:
            redacted_msg = "This is Harbourview General. Please call our clinical coordinator at 0800-427-268 regarding a recent test."
            return ConsentDecision(
                decision="redact",
                matched_labels=labels,
                outbound_message=redacted_msg,
                internal_call_script=raw_script,
                audit_fingerprint=f"REDACT|{','.join(labels)}|{patient_id}"
            )

        # 3. Otherwise -> SEND
        return ConsentDecision(
            decision="send",
            matched_labels=labels,
            outbound_message=raw_script,
            internal_call_script=raw_script,
            audit_fingerprint=f"SEND|CLEAR|{patient_id}"
        )

if __name__ == "__main__":
    gate = ConsentGate()
    
    # Test P09 (HIV - redact)
    dec09 = gate.evaluate("P09", ["HIVVL"], "HIV-1 Viral Load", "Martha Reeve HIV-1 Viral Load is Detectable.")
    assert dec09.decision == "redact"
    assert "HIV" not in dec09.outbound_message
    
    # Test P10 (Lithium - hold)
    dec10 = gate.evaluate("P10", ["LITH"], "Lithium Serum", "Lithium level 2.1 mmol/L.")
    assert dec10.decision == "hold"
    
    # Test P01 (Potassium - send)
    dec01 = gate.evaluate("P01", ["POTASSIUM"], "Potassium", "Potassium is 6.8 mmol/L.")
    assert dec01.decision == "send"
    print("[PASS] ConsentGate rules engine validated.")
