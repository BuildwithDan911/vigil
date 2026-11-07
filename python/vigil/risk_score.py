"""
Vigil Patient-Safety Risk Score Engine (Version 1.0.0)
Calculates transparent clinical risk score and enforces deterministic safety floor.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

ORDERED_LEVELS = ["no_action", "routine", "urgent", "critical"]

def level_index(lvl: str) -> int:
    try:
        return ORDERED_LEVELS.index(lvl.lower())
    except ValueError:
        return 0

def max_level(lvl1: str, lvl2: str) -> str:
    return lvl1 if level_index(lvl1) >= level_index(lvl2) else lvl2

def compute_abnormality(observations: List[Dict[str, Any]]) -> Tuple[int, str]:
    """
    Computes abnormality component across all OBX observations in the result.
    Returns (score, max_flag)
    """
    max_score = 0
    max_flag = "N"

    for obs in observations:
        flag = str(obs.get("flag", "")).strip().upper()
        if flag in ["HH", "LL", "AA"]:
            return 4, flag
        elif flag in ["H", "L", "A"]:
            if max_score < 2:
                max_score = 2
                max_flag = flag
        else:
            # Check reference range if numeric
            val = obs.get("numeric_value")
            ref_range = str(obs.get("ref_range", "")).strip()
            if val is not None and ref_range:
                if is_outside_range(val, ref_range):
                    if max_score < 2:
                        max_score = 2
                        max_flag = "A"

    return max_score, max_flag

def is_outside_range(val: float, ref_range: str) -> bool:
    try:
        if "-" in ref_range:
            parts = ref_range.split("-")
            low, high = float(parts[0].strip()), float(parts[1].strip())
            return val < low or val > high
        elif ref_range.startswith("<"):
            high = float(ref_range[1:].strip())
            return val >= high
        elif ref_range.startswith(">"):
            low = float(ref_range[1:].strip())
            return val <= low
    except Exception:
        pass
    return False

def compute_days_since_discharge(discharge_dt: Optional[datetime], result_dt: datetime) -> Tuple[Optional[int], Optional[int]]:
    """
    Returns (calendar_days, score)
    If result is before discharge, days < 0 -> returns (days, None) indicating skip.
    """
    if not discharge_dt:
        return None, None

    diff = (result_dt.date() - discharge_dt.date()).days
    if diff < 0:
        return diff, None

    if diff <= 1:
        score = 3
    elif 2 <= diff <= 7:
        score = 2
    elif 8 <= diff <= 30:
        score = 1
    else:
        score = 0

    return diff, score

def compute_vulnerability(age: int, lives_alone: bool) -> int:
    score = 0
    if age >= 75 or age < 18:
        score += 2
    if lives_alone:
        score += 1
    return min(3, score)

def compute_owner_shift(result_dt: datetime, owner: str = "dr.okonkwo") -> Tuple[int, str]:
    """
    dr.okonkwo is on day shift (07:00 - 19:00).
    dr.mensah is on night shift (19:00 - 07:00).
    Returns (score, backup_owner)
    """
    hour = result_dt.hour
    is_day = 7 <= hour < 19
    if owner == "dr.okonkwo":
        on_shift = is_day
        backup = "dr.mensah" if not on_shift else "dr.okonkwo"
    else:
        on_shift = not is_day
        backup = "dr.okonkwo" if not on_shift else "dr.mensah"

    return (0 if on_shift else 1), backup

def calculate_risk(
    observations: List[Dict[str, Any]],
    discharge_dt: Optional[datetime],
    result_dt: datetime,
    age: int,
    lives_alone: bool,
    owner: str = "dr.okonkwo"
) -> Dict[str, Any]:
    """
    Calculates full risk breakdown, band, and deterministic safety floor.
    """
    # 1. Discharge validation
    if discharge_dt is None:
        return {"skip": True, "reason": "not_discharged"}

    days_diff, days_score = compute_days_since_discharge(discharge_dt, result_dt)
    if days_diff is not None and days_diff < 0:
        return {"skip": True, "reason": "result_before_discharge"}

    # 2. Component scores
    abnormality_score, max_flag = compute_abnormality(observations)
    vuln_score = compute_vulnerability(age, lives_alone)
    off_shift_score, backup_owner = compute_owner_shift(result_dt, owner)

    total_score = abnormality_score + (days_score or 0) + vuln_score + off_shift_score

    # 3. Score Band
    # If there is zero abnormality (normal lab inside reference range), no action is required
    if abnormality_score == 0:
        band = "no_action"
    elif total_score >= 8:
        band = "critical"
    elif total_score >= 5:
        band = "urgent"
    elif total_score >= 3:
        band = "routine"
    else:
        band = "no_action"

    # 4. Safety Floor (Non-negotiable)
    floor = "no_action"
    if max_flag in ["HH", "LL", "AA"]:
        floor = "urgent"
        if vuln_score >= 2 or (days_diff is not None and days_diff <= 1):
            floor = "critical"

    final_level = max_level(band, floor)

    return {
        "skip": False,
        "score": total_score,
        "band_from_score": band,
        "floor_level": floor,
        "final_level": final_level,
        "components": {
            "abnormality": abnormality_score,
            "days_since_discharge": days_score,
            "vulnerability": vuln_score,
            "owner_off_shift": off_shift_score
        },
        "days_since_discharge_raw": days_diff,
        "max_flag": max_flag,
        "recommended_owner": backup_owner if off_shift_score > 0 else owner,
        "rule_version": "1.0.0"
    }
