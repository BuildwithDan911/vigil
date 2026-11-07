# Day 1 Technical Verification & Truth Log (Vigil for IRIS for Health)

**Date:** 7 November 2026  
**Platform Target:** InterSystems IRIS for Health Community AI Hub  
**Target Build:** `irishealth-community:2027.1.0AI.109.0`  
**Fallback Build:** `irishealth-community:2026.3.0AI.154.0` (Official announcement baseline)

---

## 1. Environment & Build Truth

| Component | Target Truth | Verification Status | Notes |
|---|---|---|---|
| **Base Image** | `irishealth-community:2027.1.0AI.109.0` | Verified per Organizer Tatiana Tikhonova (2 Nov 2026) | Staff confirmed build 109 is accepted and preferred as the newest release. |
| **Namespace** | `IRISAPP` | Configured via `merge.cpf` | Interoperability enabled (`Interop=1`). |
| **Security / Passwords** | Unexpired dev passwords | Verified via `iris.script` | `UnExpireUserPasswords("*")` in `%SYS` prevents dev lockout. |
| **Default Ports** | SuperServer `1972`, Web `52773` | Configured with fallback `1973/52774` | Documented in `.env.example` and `docker-compose.yml`. |

---

## 2. AI Hub & LLM Architecture Verification

### A. Provider Construction
* **Target Provider:** Google Gemini (`gemini-2.5-flash`).
* **Construction Pattern:**
  ```objectscript
  Set provider = ##class(%AI.Provider).Create("gemini", {"api_key": apiKey})
  ```
* **Gotcha Handled:** `LLMConfig` is deprecated on builds $\ge$ 154. The `%AI.Provider.Create` pattern with explicit API key parameter passing avoids wallet configuration crashes.
* **Zero-Key Execution:** When `GEMINI_API_KEY` is empty or `VIGIL_MODE=replay`, the Business Process bypasses external API calls, executing 100% deterministic local replay and rule evaluation with zero live cost.

### B. Agent Lifecycle (`Vigil.AI.LoopAgent`)
* **Base Class:** `%AI.Agent`.
* **Initialization Sequence:**
  ```objectscript
  Do agent.%Init()
  Set session = agent.CreateSession()
  ```
* **Response Content & Usage:** Agent output is read from `response.Content` (not `%Get()`), and token consumption is read from `response.Usage` for DPI-I-689 message tracing.

---

## 3. HL7 v2 Ingestion & Abnormality Extraction

### A. Segment Delimitation
* InterSystems `EnsLib.HL7.Message.ImportFromString(raw, .sc)` expects `$C(13)` (carriage return `\r`) segment delimiters.
* `generate_night.py` emits clean `\r` separated segments for `MSH`, `PID`, `PV1`, `EVN`, `OBR`, and `OBX`.

### B. Path Resolution
* Observation test codes: `OBX:3.1` or numeric index `OBX:3`.
* Observation values: `OBX:5`.
* Reference ranges: `OBX:7` (handles `low-high`, `<high`, `>low`).
* Abnormal flags: `OBX:8` (`HH`, `LL`, `AA`, `H`, `L`, `A`, `N`).
* Discharge datetime: `PV1:45` (fallback to message timestamp `MSH:7` if absent on A03).

---

## 4. Safety Floor & Adversarial Guardrails

### Verified Mathematical Bounds (`Vigil.Score.Floor`)
1. **Critical Safety Floor:** If any OBX flag is `HH`, `LL`, or `AA` **AND** (`vulnerability >= 2` OR `days_since_discharge <= 1`), the floor is strictly locked to **`critical`**.
2. **Urgent Safety Floor:** If any OBX flag is `HH`, `LL`, or `AA`, the floor is at least **`urgent`**.
3. **Adversarial Interception:** If an agent prompt injection attempts to recommend an urgency below `floor_level`, the Business Process overrides the model recommendation, forces `final_level = floor_level`, flags `decision_source = rules_floor`, and records the rejection reason into the SHA-256 ledger.

---

## 5. DPI-I-689 Visual Trace Telemetry

Every execution through `Vigil.BO.Decide` generates a `Vigil.Msg.AgentDecision` message containing:
* `PromptVersion` (`loop-decision-v1`)
* `Model` (`gemini-2.5-flash` or `recorded-replay`)
* `TokenInput` & `TokenOutput`
* `LatencyMs`
* `ToolNames` (`GetScoreBreakdown`, `GetSimilarCases`, `GetRoster`, `GetConsent`)
* `FallbackReason` (empty on normal execution, populated on adversarial rejection or timeout)
* `Mode` (`live` vs `replay`)

This telemetry is visible in the InterSystems Management Portal Visual Trace (`/csp/irisapp/EnsPortal.MessageViewer.zen`).
