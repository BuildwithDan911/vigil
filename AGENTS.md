# Vigil Agent Specifications & System Boundaries

## Core Purpose
Vigil is an autonomous patient-safety handoff engine built on InterSystems IRIS for Health. It monitors clinical events across disparate hospital systems to catch patients who fall through the cracks after discharge and during referral workflows.

## Safety Architecture
- **Rules First, Model Second, Human Last:** An Embedded Python scoring engine establishes a deterministic Safety Floor (`specs/risk-score.md`).
- **Safety Floor Governance:** The AI Hub Agent (`Vigil.AI.LoopAgent`) may upgrade urgency freely based on nuance, but is mathematically blocked from downgrading below the safety floor.
- **DPI-I-689 Tracing:** All decisions, token consumption, latencies, prompt versions, and rejection reasons are traced into interoperability messages.
- **Consent Gate:** Outbound SMS communications pass through a deterministic privacy filter (`specs/consent-rules.md`) redacting sensitive diagnostic codes or holding messages per patient preference.
- **Cryptographic Audit:** Every lifecycle state change is appended to a SHA-256 hash-chained immutable ledger (`specs/ledger-format.md`).
- **Human Accountability:** Critical loops cannot auto-close without clinician sign-off via native InterSystems Workflow tasks (`VigilApprovers`).
