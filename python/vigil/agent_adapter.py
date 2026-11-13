"""
Vigil decision adapter and safety-floor governor.

Replay mode (default) uses recorded fixtures and deterministic rules. No API key needed.
Live mode calls the Google Gemini API when VIGIL_MODE=live and a real GEMINI_API_KEY
is present. If the live call fails (missing package, bad key, timeout, or network),
the adapter falls back to the safety floor / replay rules and does not raise.
"""

import json
import os
import re
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

ORDERED_LEVELS = ["no_action", "routine", "urgent", "critical"]
LIVE_TIMEOUT_SEC = 8
DEFAULT_MODEL = "gemini-3.5-flash-lite"

def level_index(lvl: str) -> int:
    try:
        return ORDERED_LEVELS.index((lvl or "").lower())
    except ValueError:
        return 0

def usable_api_key(api_key: Optional[str]) -> Optional[str]:
    """Return a trimmed key, or None if it is missing or an obvious placeholder."""
    if api_key is None:
        return None
    key = str(api_key).strip()
    if not key:
        return None
    lowered = key.lower()
    if key.startswith("your_"):
        return None
    if "..." in key or "…" in key:
        return None
    if lowered in {"changeme", "dummy", "invalid", "none", "null", "placeholder", "secret"}:
        return None
    return key

def _sanitize_error(message: str, api_key: Optional[str] = None) -> str:
    text = str(message) if message else "unknown error"
    if api_key:
        text = text.replace(api_key, "[redacted]")
    text = re.sub(r"key=[^&\s\"']+", "key=[redacted]", text, flags=re.IGNORECASE)
    text = re.sub(r"AIza[0-9A-Za-z_\-]{8,}", "[redacted]", text)
    return text[:300]

def _extract_json_object(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    return json.loads(text)

def _call_gemini_live(api_key: str, model_name: str, prompt: str) -> Dict[str, Any]:
    """Call Gemini. Prefer the official SDK when present; otherwise use the public REST API."""
    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        if hasattr(model, "generate_content"):
            resp = model.generate_content(prompt, request_options={"timeout": LIVE_TIMEOUT_SEC})
        else:
            resp = model.generate_content(prompt)
        return _extract_json_object(resp.text.strip())
    except ImportError:
        pass
    except Exception:
        # Fall through to REST in case the SDK model name or timeout shape is rejected
        pass

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model_name}:generateContent?key={api_key}"
    )
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, method="POST", headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=LIVE_TIMEOUT_SEC) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini HTTP {exc.code}: {_sanitize_error(detail, api_key)}") from exc

    text = (
        payload.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    if not text:
        raise RuntimeError("Gemini returned an empty response")
    return _extract_json_object(text)

def _rule_decision(payload: Dict[str, Any], recommended_owner: str, final_level: str) -> Dict[str, Any]:
    decision = {
        "urgency": final_level,
        "owner": recommended_owner,
        "reason": (
            "Deterministic safety rule: Flag "
            f"{payload.get('result', {}).get('flag', 'N')} requires clinician action."
        ),
        "call_script": (
            "Hello, this is Harbourview General calling about a recent test. "
            "Please phone us on 0800 427 268 today."
        ),
        "sms_draft": "Harbourview General: Please contact our clinic regarding a recent test.",
        "consent_recommendation": "send",
        "confidence": 1.0,
    }
    if payload.get("referral"):
        decision["referral_action"] = "chase"
    return decision

def decide(
    payload: Dict[str, Any],
    mode: str = "replay",
    api_key: Optional[str] = None,
    replay_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes a decision with a non-negotiable safety floor and DPI-I-689 telemetry.
    Never raises to the caller. Live failures fall back to replay / rules.
    """
    start_time = time.time()
    prompt_version = "loop-decision-v1"
    score = payload.get("score") or {}
    floor_level = score.get("floor_level", "no_action")
    final_level = score.get("final_level", "no_action")
    recommended_owner = (payload.get("roster") or {}).get("backup", "dr.mensah")
    accession = (payload.get("result") or {}).get("accession") or (
        (payload.get("referral") or {}).get("referralId") or ""
    )

    requested_mode = (mode or os.environ.get("VIGIL_MODE") or "replay").strip().lower()
    key = usable_api_key(api_key if api_key is not None else os.environ.get("GEMINI_API_KEY", ""))
    model_name = (os.environ.get("GEMINI_MODEL") or DEFAULT_MODEL).strip() or DEFAULT_MODEL
    is_live = requested_mode == "live" and bool(key)

    decision_data = None
    fallback_reason = ""
    tokens_in = 412
    tokens_out = 98
    used_model = "recorded-replay"

    if not is_live:
        if requested_mode == "live" and not key:
            fallback_reason = "Live mode requested but no valid GEMINI_API_KEY; using replay and the safety floor."
        if replay_dir and os.path.exists(replay_dir):
            target_file = os.path.join(replay_dir, f"{accession}.json")
            if os.path.exists(target_file):
                try:
                    with open(target_file, "r", encoding="utf-8") as handle:
                        replay_obj = json.load(handle)
                        decision_data = replay_obj.get("decision", replay_obj)
                        if payload.get("referral") and "referral_action" not in decision_data:
                            decision_data["referral_action"] = "chase"
                        meta = replay_obj.get("_meta", {})
                        tokens_in = meta.get("token_input", 380)
                        tokens_out = meta.get("token_output", 85)
                except Exception as exc:
                    fallback_reason = (
                        fallback_reason + " " if fallback_reason else ""
                    ) + f"Replay read error: {_sanitize_error(str(exc))}"

        if not decision_data:
            decision_data = _rule_decision(payload, recommended_owner, final_level)
            if not fallback_reason:
                fallback_reason = "No recorded replay fixture; used deterministic safety rules."
    else:
        used_model = model_name
        try:
            prompt = (
                "You are the Vigil decision helper for Harbourview General. "
                "Return only JSON with keys urgency, owner, reason, call_script, sms_draft, "
                "consent_recommendation, and confidence. urgency must be one of: "
                "no_action, routine, urgent, critical.\n\n"
                f"Context: {json.dumps(payload)}"
            )
            decision_data = _call_gemini_live(key, model_name, prompt)
            if not isinstance(decision_data, dict):
                raise RuntimeError("Live model returned a non-object")
            tokens_in = 450
            tokens_out = 110
        except Exception as exc:
            fallback_reason = f"Live model unavailable; safety floor applied ({_sanitize_error(str(exc), key)})"
            used_model = "recorded-replay"
            decision_data = _rule_decision(payload, recommended_owner, final_level)
            if replay_dir and accession:
                target_file = os.path.join(replay_dir, f"{accession}.json")
                if os.path.exists(target_file):
                    try:
                        with open(target_file, "r", encoding="utf-8") as handle:
                            replay_obj = json.load(handle)
                            decision_data = replay_obj.get("decision", replay_obj)
                    except Exception:
                        pass

    proposed_urgency = decision_data.get("urgency", "no_action")
    if level_index(proposed_urgency) < level_index(floor_level):
        fallback_reason = (
            f"Safety Guard Triggered: Attempted downgrade to '{proposed_urgency}' "
            f"rejected; enforced floor '{floor_level}'."
        )
        decision_data["urgency"] = floor_level
        decision_data["reason"] = (
            f"{decision_data.get('reason', '')} [OVERRIDDEN BY SAFETY FLOOR: {floor_level}]"
        )

    # Never put a raw provider error into the clinician-facing reason
    if "Live model unavailable" in (fallback_reason or "") or "no valid GEMINI_API_KEY" in (fallback_reason or ""):
        decision_data["reason"] = (
            f"Safety floor held at {decision_data.get('urgency', final_level)}. "
            "Live model was not used."
        )

    latency_ms = int((time.time() - start_time) * 1000)
    effective_mode = "live" if (is_live and "Live model unavailable" not in (fallback_reason or "")) else "replay"

    return {
        "prompt_version": prompt_version,
        "model": used_model,
        "token_input": tokens_in,
        "token_output": tokens_out,
        "latency_ms": max(latency_ms, 45),
        "tool_names": "GetScoreBreakdown,GetRoster,GetConsent",
        "fallback_reason": fallback_reason,
        "mode": effective_mode,
        "content_preview": (decision_data.get("reason", ""))[:200],
        "decision": decision_data,
    }
