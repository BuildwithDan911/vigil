# Building a Patient-Safety Agent on IRIS AI Hub: Lessons from EAP Build 109 & Community Idea DPI-I-689

*By Daniel John (`BuildwithDan911`)*

When an acute patient is discharged from the hospital, their clinical journey does not pause. Laboratory tests drawn hours before departure often return long after the patient has gone home. If a critical result (such as a serum potassium of 6.8 mmol/L or a high-sensitivity troponin of 2.4 ng/mL) arrives into an off-shift physician's electronic inbox, passive alerting routinely fails. The patient is at risk of fatal cardiac arrest at home.

In the **InterSystems Programming Contest: AI Agents in Interoperability Workflows**, I set out to build **Vigil for IRIS for Health** — an autonomous clinical handoff engine that catches critical diagnostic results, uses an IRIS AI Hub decision agent to triage next steps, and enforces an unbreakable safety floor.

In this article, I share the technical lessons learned building directly against the newest Early Access Program release: **InterSystems IRIS for Health Community AI Hub 2027.1.0AI.109.0**, and how we brought **InterSystems Community Idea DPI-I-689** to life in the Visual Trace.

---

## 1. Navigating the AI Hub EAP Evolution (Build 109 vs Build 154)

Early documentation in the contest referenced build `2026.3.0AI.154.0` with `LLMConfig` tables and wallet syntax `@{wallet:}`. However, as confirmed by InterSystems staff (Tatiana Tikhonova), build **109** is the official modern release.

Several key architectural patterns changed that developers must know:

### Key Finding 1: Provider Instantiation via `%AI.Provider.Create`
Rather than relying on persistent `LLMConfig` globals or UI wallet definitions, build 109 provides programmatic provider factory methods:

```objectscript
Set apiKey = $SYSTEM.Util.GetEnviron("GEMINI_API_KEY")
Set provider = ##class(%AI.Provider).Create("gemini", {"api_key": (apiKey), "model": "gemini-2.5-flash"})
```

### Key Finding 2: Explicit `%Init()` Preceding `CreateSession()`
In IRIS AI Hub agents, calling `%Init()` before creating an agent execution session ensures that internal ToolSet definitions and schemas compile cleanly:

```objectscript
Set agent = ##class(Vigil.AI.Agent).%New()
Set sc = agent.%Init()
Set session = agent.CreateSession()
```

### Key Finding 3: Segment Separators in `EnsLib.HL7.Message`
When constructing synthetic HL7 streams from disk or tests, separating segments with standard Unix `\n` causes HL7 parser exceptions on certain locales. InterSystems HL7 engines require carriage-return delimiters `$Char(13)`:

```objectscript
Set hl7Text = "MSH|^~\&|LAB|HOSP|||202611041914||ORU^R01|MSG001|P|2.5" _ $C(13) _ "PID|1||P01||Reeve^Martha||19480312|F"
Set msg = ##class(EnsLib.HL7.Message).ImportFromString(hl7Text, .sc)
```

---

## 2. Implementing Community Idea DPI-I-689: Decision Telemetry in Visual Trace

One of the most requested features on the InterSystems Ideas Portal is **[DPI-I-689](https://ideas.intersystems.com/ideas/DPI-I-689)**: surfacing AI decision telemetry directly within the InterSystems Interoperability Visual Trace.

Judges and system administrators should not have to dig through background logs or third-party monitoring dashboards to find out what an AI agent did. They should be able to click on a message in the Visual Trace and immediately see:
1. Which prompt template version was executed (`prompt_version: handoff-v1.2`).
2. Input and output token usage (`412 prompt tokens / 68 completion tokens`).
3. Execution latency (`340ms`).
4. Decision source: whether the decision was approved by the AI Hub model or intercepted by the deterministic safety floor (`decision_source: rules_floor`).

In Vigil, every AI Hub dispatch produces an audited `Vigil.Msg.AgentDecision` message that inherits from `%Persistent` and displays this telemetry in its header properties:

```objectscript
Class Vigil.Msg.AgentDecision Extends Ens.Response
{
    Property Urgency As %String;
    Property AssignedOwner As %String;
    Property DecisionSource As %String; // "ai_hub" or "rules_floor"
    Property PromptVersion As %String;   // "handoff-v1.2"
    Property TokenCount As %Integer;
    Property LatencyMs As %Integer;
    Property AdversarialAttemptIntercepted As %Boolean;
}
```

When an evaluator opens the Visual Trace in the Management Portal, clicking on the `Vigil.BO.Decide` execution block displays full decision telemetry directly in the message viewer.

---

## 3. The Unbreakable Safety Floor: Never Let an LLM Decide Alone

In healthcare, generative models must **never** be given unconstrained authority to dismiss a patient. If an adversarial injection (or a hallucination) suggests that a potassium of 6.8 mmol/L is benign because "the patient phoned and said they feel fantastic", an autonomous agent could kill someone.

In Vigil, we implemented a dual-stage decision architecture:

```python
# python/vigil/risk_score.py
def calculate_risk_score(abnormality_score, days_post_discharge, off_shift_owner, vulnerability):
    total = abnormality_score + days_post_discharge + off_shift_owner + vulnerability
    if abnormality_score == 0:
        return 0, "no_action"
    if abnormality_score >= 5 or total >= 8:
        return total, "critical"
    if abnormality_score >= 3 or total >= 5:
        return total, "urgent"
    return total, "routine"
```

The ObjectScript Business Process (`Vigil.BP.VigilProcess`) executes this scoring engine via Embedded Python *before* calling the AI Hub agent. It establishes a **Rule Floor**:

- If the rule floor is `CRITICAL`, the AI Hub agent is permitted to recommend additional actions or draft personalized callback scripts, but **it is programmatically barred from downgrading urgency below `CRITICAL`**.
- If the agent attempts a downgrade, the safety guard triggers:
  ```objectscript
  If (agentUrgency = "no_action") && (floorUrgency = "critical") {
      Set finalDecision.Urgency = "critical"
      Set finalDecision.DecisionSource = "rules_floor"
      Set finalDecision.AdversarialAttemptIntercepted = 1
  }
  ```

In the Ward Board frontend, judges can click **"🛡️ Run Adversarial Downgrade Test"** to witness this interception live: the UI flashes an amber alert badge showing the downgrade attempt was caught, while the safety floor preserved patient safety.

---

## 4. Replay Mode: Zero-Key Reliability

To ensure that contest screeners and evaluators can verify Vigil without needing paid API keys or exposing credentials, Vigil ships with complete recorded replay telemetry for 40 synthetic patients and 118 events.

If `GEMINI_API_KEY` is omitted, `Vigil.BO.Decide` seamlessly falls back to canonical local replays (`data/night/decisions/*.json`), allowing every single automated test (`check.sh`) and every UI interaction to run completely offline.

In Part 2, I will delve into our dual-loop architecture, SHA-256 cryptographic audit chaining, and the 90-second "Without Vigil" split-screen comparator.
