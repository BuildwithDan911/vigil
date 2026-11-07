"""
Vigil Referral Leakage Engine
Monitors outbound clinical referrals and opens loops for unbooked consultations past clinical SLA.
"""

from datetime import datetime
from typing import Dict, Any, Optional

def evaluate_referral(
    referral: Dict[str, Any],
    current_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Evaluates referral record.
    Returns decision dict with 'opens_loop', 'urgency', 'referral_action', and 'reason'.
    """
    if current_time is None:
        current_time = datetime(2026, 11, 4, 19, 0) # Night shift start baseline

    booking_status = str(referral.get("bookingStatus", "none")).lower()
    
    # If already booked, no leakage exists
    if booking_status == "booked":
        return {
            "opens_loop": False,
            "referral_action": None,
            "urgency": "no_action",
            "reason": "Referral appointment confirmed booked"
        }

    sent_at_str = referral.get("sentAt", "")
    sent_at = datetime.fromisoformat(sent_at_str)
    hours_elapsed = (current_time - sent_at).total_seconds() / 3600.0

    specialty = str(referral.get("specialty", "")).lower()
    
    # Priority specialty SLAs: oncology and cardiology floor is 48 hours; routine is 72 hours
    is_urgent_specialty = specialty in ["oncology", "cardiology", "neurology"]
    sla_hours = 48.0 if is_urgent_specialty else 72.0

    if booking_status == "cancelled":
        return {
            "opens_loop": True,
            "referral_action": "rebook",
            "urgency": "urgent" if is_urgent_specialty else "routine",
            "hours_elapsed": hours_elapsed,
            "reason": f"Cancelled referral to {referral.get('referredTo')} requires clinician rebooking."
        }

    if hours_elapsed >= sla_hours:
        urgency = "critical" if (is_urgent_specialty and hours_elapsed >= 72.0) else "urgent"
        return {
            "opens_loop": True,
            "referral_action": "chase",
            "urgency": urgency,
            "hours_elapsed": hours_elapsed,
            "reason": f"Unbooked {specialty} referral sent {int(hours_elapsed)}h ago exceeds {int(sla_hours)}h chase threshold."
        }

    return {
        "opens_loop": False,
        "referral_action": None,
        "urgency": "no_action",
        "hours_elapsed": hours_elapsed,
        "reason": f"Within normal booking window ({int(hours_elapsed)}h / {int(sla_hours)}h)"
    }
