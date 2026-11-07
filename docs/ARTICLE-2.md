# Closing the Diagnostic Loop: Dual Workflows, SHA-256 Ledgers, and the "Without Vigil" Split

*By Daniel John (`BuildwithDan911`)*

In part one of this series, I explored how we architected **Vigil for IRIS for Health** using the newest InterSystems AI Hub Community release (build 109) and brought Community Idea [DPI-I-689](https://ideas.intersystems.com/ideas/DPI-I-689) to life in the Visual Trace.

In this concluding installment, I will focus on the clinical workflow design: how Vigil handles **two distinct handoff failure loops**, why we built a **cryptographic SHA-256 audit ledger**, and how our 90-second **"Without Vigil" split-screen comparator** demonstrates quantifiable patient-safety outcomes.

---

## 1. Beyond Lab Results: The Dual Loop Architecture

Most patient-safety alerting tools make a fundamental architectural error: they treat lab results as the only source of diagnostic leakage. But in real hospital environments, **outbound specialist referrals** are just as vulnerable to abandonment.

Consider an 82-year-old patient discharged from the medical ward with a suspicious pulmonary nodule. The team places an outbound oncology referral. If the receiving cancer clinic never calls, or the patient fails to schedule within 48 hours, the referral quietly drops off the radar. Months later, the patient returns with stage IV disease.

Vigil unifies both diagnostic handoff loops into a single interoperability engine:

| Loop Type | Incoming Trigger | Danger Window | Clinical Action |
|---|---|---|---|
| **Results After Discharge** | HL7 `ORU^R01` received after `ADT^A03` | Post-discharge (0–7 days) | Re-assign from off-shift doctor to on-duty ward clinician; compute urgency; generate callback script. |
| **Referral Leakage** | Referral message with unbooked consultation | Exceeds SLA (48h oncology/cardiology, 72h routine) | Trigger patient navigation outreach; rebook consultation; escalate to clinic director. |

By supporting both loop types inside `Vigil.BP.VigilProcess`, health systems eliminate two of the leading causes of outpatient diagnostic failure with a single InterSystems production.

---

## 2. Who Knew What, and When? The SHA-256 Loop Ledger

In medical malpractice litigation and clinical peer reviews, the central question is always evidentiary: *Who was notified of the test result, what did they know, and exactly when did they act?*

Standard database transaction logs can be altered by database administrators or corrupted during system upgrades. To provide tamper-evident mathematical certainty, Vigil implements an append-only **Cryptographic Loop Ledger** (`Vigil.Data.LedgerEvent` and `Vigil.Ledger.Chain`).

### Canonical Hashing Protocol
Implemented via Embedded Python using `hashlib.sha256`:
1. Every event has a sequential index `Seq` (starting at 1 hospital-wide).
2. The genesis record links to 64 zeros (`"0" * 64`).
3. Each subsequent record computes:
   $$\text{Hash} = \text{SHA-256}(\text{PrevHash} + \text{"\\n"} + \text{canonical\_json}(\text{headers\_and\_payload}))$$
4. Canonical JSON enforces strictly sorted keys without extraneous whitespace, ensuring 100% deterministic reproducibility across platforms.

```python
# python/vigil/ledger.py
def compute_record_hash(prev_hash: str, headers_and_payload: dict) -> str:
    canon = json.dumps(headers_and_payload, sort_keys=True, separators=(',', ':'))
    to_hash = f"{prev_hash}\n{canon}".encode("utf-8")
    return hashlib.sha256(to_hash).hexdigest()
```

### Interactive UI Verification & Tamper Simulation
In the Ward Board frontend under the **Loop Ledger** tab:
- Clinicians and auditors can click **"Verify Chain"**: the engine walks every block, recalculates the cryptographic signature, and displays a green `✓ Chain Verified` badge.
- Judges can click **"Simulate Data Tamper"**: the client mutates the actor or payload of block #2 in-memory. The verification immediately detects the hash mismatch and flashes a high-visibility warning:
  `⚠️ Tamper Detected at Seq #2: Hash mismatch! Expected 3c4e... got modified...`

---

## 3. The 90-Second Night Shift Replay & "Without Vigil" Split

To demonstrate Vigil's real-world impact in an evaluation setting, we created the **Night Shift Simulation Player** (`Vigil.Adapter.NightShiftInbound` and `Vigil.BS.NightShift`).

Rather than forcing judges to wait 24 wall-clock hours, Vigil compresses a 24-hour night shift (04 Nov 19:00 to 05 Nov 19:00) into **90 seconds**. Judges can play, pause, or accelerate speed (1x, 2x, 4x) as synthetic hospital messages arrive in real-time.

### The Side-by-Side Contrast
The Night Shift player features a split-screen view contrasting modern hospital reality:

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│  WITH VIGIL (Active Safety Net)     │  WITHOUT VIGIL (Standard EMR)        │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Martha Reeve (K+ 6.8): Caught at   │ • 21:14: Result arrives in empty     │
│   21:14; assigned to Dr. Mensah      │   inbox. Dr. Okonkwo off-shift.      │
│ • Samuel Okai (Trop 2.4): Accepted   │ • 22:30: Troponin unread. 0 calls    │
│   in Workflow Inbox in 15 mins       │   made to patient.                   │
│ • SLA timers ticking; 1 escalation   │ • 3 PATIENTS LOST TO FOLLOW-UP       │
│ • 0 patients lost to follow-up       │ • Unmonitored delay: 14.2 hours      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

This contrast makes the clinical utility immediately tangible: without active escalation clocks and assigned handoff ownership, passive alerting fails.

---

## 4. Privacy & Consent Gate

Before any outbound notification reaches a patient, Vigil executes a privacy consent evaluation (`Vigil.Data.Consent` and `python/vigil/consent.py`).

1. **Sensitive Diagnostic Redaction**: If a test involves sensitive categories (e.g. HIV viral load, sexual health, substance use) and the patient's record indicates `share_sensitive: false`, the outward SMS automatically strips the diagnostic name and result value:
   *"This is Harbourview General. Please call our clinical coordinator at 0800-427-268 regarding a recent test."*
2. **SMS Opt-Out Hold**: If a patient opted out of text notifications (`share_results_sms: false`, such as in mental health lithium monitoring), the outward text is placed on `HOLD`. The loop remains active on the board, requiring an internal clinical phone call.
3. **Review Queue**: All held and redacted messages appear in the `/consent` tab for clinician sign-off.

---

## 5. Conclusion

By uniting InterSystems IRIS for Health interoperability, AI Hub agent intelligence, deterministic clinical rules, and cryptographic auditability, Vigil transforms passive alerts into guaranteed clinical closures.

Vigil is open source under the MIT License:  
👉 **GitHub Repository:** `https://github.com/BuildwithDan911/vigil`
