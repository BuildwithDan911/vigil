# Vigil for IRIS for Health — Build & Verification Log

**Contest:** [InterSystems Programming Contest: AI Agents in Interoperability Workflows (Contest #49)](https://openexchange.intersystems.com/contest/49)  
**Author:** Daniel John (`danielbasseyj@gmail.com` / [BuildwithDan911](https://github.com/BuildwithDan911))  
**Repository:** [`BuildwithDan911/vigil`](https://github.com/BuildwithDan911/vigil)  
**Verification Date:** 8 November 2026  
**Build Status:** ✅ **PASSED (13/13 Automated Tests 100% Green, Live Container Verified)**

---

## 1. System & Container Environment

| Parameter | Value | Verification Status |
|---|---|:---:|
| **Target Image** | `irishealth-community:2027.1.0AI.109.0` | ✅ Verified |
| **Image ID** | `6bf9af033b9e` | ✅ Verified |
| **Container Name** | `vigil-iris` | ✅ Running / Healthy |
| **Host OS** | Windows 11 (Docker Desktop / WSL2) | ✅ Verified |
| **SuperServer Port** | `1972` (`0.0.0.0:1972`) | ✅ Bound & Accessible |
| **Web Gateway Port** | `52773` (`0.0.0.0:52773`) | ✅ Bound & Accessible |
| **Web Server (UI)** | `http://localhost:8000/` | ✅ Running |
| **InterSystems Namespace**| `IRISAPP` (Interoperability Enabled `Interop=1`) | ✅ Initialized |
| **Runtime Mode** | `replay` (Zero-Key Offline Evaluation Mode) | ✅ Active |

---

## 2. Docker Image & Tagging Audit

The official InterSystems AI Hub Early Access Program image tarball was loaded and tagged for zero-friction Compose execution:

```
TARBALL: C:\Users\USER\Downloads\iris-community-2027.1.0AI.109.0-docker.tar.gz (3.15 GB)
LOADED:  docker.iscinternal.com/docker-intersystems/intersystems/iris-community:2027.1.0AI.109.0
TAGS:    irishealth-community:2027.1.0AI.109.0
         iris-community:2027.1.0AI.109.0
```

---

## 3. Production & ObjectScript Class Compilation

All 23 application classes compiled into namespace `IRISAPP` with zero errors:

| Class Package | Classes Compiled | Role in Workflow |
|---|---|---|
| **`Vigil.Production`** | `Vigil.Production` | Central InterSystems Interoperability Production definition |
| **`Vigil.Setup`** | `Vigil.Setup` | Automated IPM installation, CSP web app, and security hook |
| **`Vigil.BP`** | `Vigil.BP.VigilProcess` | Central Business Process coordinating risk floor, AI agent, and escalation ladders |
| **`Vigil.BO`** | `Vigil.BO.Decide`, `Vigil.BO.PEXAuditor` | InterSystems AI Hub agent decision operation & Java PEX auditor |
| **`Vigil.BS`** | `Vigil.BS.ADTIn`, `Vigil.BS.ORUIn`, `Vigil.BS.ReferralIn`, `Vigil.BS.NightShift` | Inbound services for HL7 ADT, ORU, Referral, and Night Shift replay |
| **`Vigil.Adapter`** | `Vigil.Adapter.NightShiftInbound` | Custom inbound adapter driving simulated hospital clock ticks |
| **`Vigil.Data`** | `Patient`, `Observation`, `Encounter`, `Loop`, `Consent`, `CaseMemory`, `LedgerEvent` | Persistent clinical models, vector memory table, and hash ledger |
| **`Vigil.Score`** | `Vigil.Score.Engine` | Deterministic clinical risk floor scoring engine (Embedded Python) |
| **`Vigil.Ledger`** | `Vigil.Ledger.Chain` | Append-only SHA-256 cryptographic audit chain |
| **`Vigil.AI`** | `Vigil.AI.Tools` | InterSystems AI Hub agent function-calling toolset |
| **`Vigil.Msg`** | `AgentRequest`, `AgentDecision` | Interoperability request/response message payloads |
| **`Vigil.Web`** | `Vigil.Web.Dispatcher` | `%CSP.REST` dispatcher serving modern clinical frontend |

---

## 4. Live REST API Verification Audit

Executed directly against `http://localhost:52773` on the live running container:

### A. Health Check (`GET /vigil/api/health`)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy",
  "service": "Vigil for IRIS for Health",
  "version": "1.0.0",
  "timestamp": "2026-11-07 23:37:40",
  "mode": "replay"
}
```

### B. Contest & Architecture Info (`GET /vigil/api/info`)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "name": "Vigil for IRIS for Health",
  "contest": "InterSystems Programming Contest: AI Agents in Interoperability Workflows",
  "idea": "DPI-I-689",
  "author": "Daniel John (BuildwithDan911)",
  "design_standard": "Clinical Safety Handoff and Escalation Guidelines",
  "disclaimer": "Synthetic Harbourview General clinical data only; not a medical device; not for real patients."
}
```

### C. Clinical Safety & Comparison Report (`GET /vigil/api/demo/report`)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "kpis": {
    "loopsOpened": 14,
    "criticalCaught": 3,
    "referralsMonitored": 4,
    "medianTimeToOwnMinutes": 18,
    "medianTimeToActMinutes": 45,
    "escalationsHandled": 2,
    "consentHolds": 2
  },
  "withoutVigilComparison": {
    "lostToFollowUp": 3,
    "vigilClosedAndOwned": 14
  }
}
```

---

## 5. Automated Test Suite Results

Run via `powershell -ExecutionPolicy Bypass -File scripts/check.ps1`:

```
==========================================================
   Vigil for IRIS for Health - Automated Test Suite Runner
==========================================================

--> Executing tests/test_risk_score.py...
[PASS] Phase 3 Risk Score Fixture Verification (7/7 Passed)

--> Executing tests/test_referral.py...
[PASS] Phase 4 Referral Leakage Verification (4/4 Passed)

--> Executing tests/test_agent_decision.py...
[PASS] Phase 5 AI Hub Agent & DPI-I-689 Tracing Verification (4/4 Passed)

--> Executing tests/test_escalation.py...
[PASS] Phase 6 Workflow & Escalation Clock Verification (5/5 Passed)

--> Executing tests/test_ui_palette.py...
[PASS] Modern Clinical UI, Design Tokens, and Zero-WHO Compliance Verified.

--> Executing tests/test_night_shift.py...
[PASS] Phase 8 Night Shift and Without Vigil verified.

--> Executing tests/test_consent.py...
[PASS] Phase 9 Consent Gate rules and redaction verified.

--> Executing tests/test_ledger.py...
[PASS] Phase 10 Cryptographic Ledger & Tamper Detection verified.

--> Executing tests/test_vector_memory.py...
[PASS] Phase 11 Vector Case Memory similarity searches verified.

--> Executing tests/test_i18n.py...
[PASS] Phase 12 Multilingual scripts verified for all 6 languages.

--> Executing tests/test_pex_auditor.py...
[PASS] Phase 13 PEX Score Auditor verification passed.

--> Executing tests/test_ipm_clean.py...
[PASS] Phase 14 IPM descriptor and Online Demo Guide verified.

--> Checking for committed secrets...
[PASS] Zero committed secrets confirmed (.env and answer-key gitignored).

==========================================================
TEST SUMMARY: 13 Passed, 0 Failed. (100% Green)
==========================================================
```

---

## 6. Build Issues Identified & Permanently Resolved

1. **CPF Merge Section Format:** Duplicate `[Security]` section removed; simplified `merge.cpf` to declarative `[Actions]` block creating `IRISAPP` database and namespace with `Interop=1`.
2. **`Ens.BusinessService.OnProcessInput` Signature:** Corrected parameter typing to `%RegisteredObject` with polymorphic object/string unwrapping.
3. **Web Gateway REST Authentication:** Upgraded `AutheEnabled` bitmask to `96` (32 Unauthenticated + 64 Password) and set `MatchRoles=":%All"` in `Vigil.Setup.cls` to guarantee zero-auth friction for judges evaluating the REST API.
4. **Redundant Apt Installs Removed:** Container builds cleanly using pre-installed OpenJDK 11 and Python 3.12 without external package downloads.
