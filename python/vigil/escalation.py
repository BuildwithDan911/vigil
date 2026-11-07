"""
Vigil Escalation Engine & Hospital Clock (specs/escalation-slas.md)
Monitors open loops against clinical SLAs and escalates ignored criticals across the clinical ladder:
1. Primary Owner (dr.okonkwo) -> 2. Backup (dr.mensah) -> 3. Department Head (dr.adewale).
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List

LADDER = ["dr.okonkwo", "dr.mensah", "dr.adewale"]

SLA_LIMITS = {
    "critical": {"owned_hours": 2, "acted_hours": 4},
    "urgent": {"owned_hours": 8, "acted_hours": 16},
    "routine": {"owned_hours": 24, "acted_hours": 48}
}

def next_escalation_owner(current_owner: str) -> str:
    if current_owner == "dr.okonkwo":
        return "dr.mensah"
    elif current_owner == "dr.mensah":
        return "dr.adewale"
    return "dr.adewale" # Department head is top of ladder

def evaluate_loop_escalation(
    loop: Dict[str, Any],
    simulated_now: datetime
) -> Dict[str, Any]:
    """
    Checks if loop has breached SLA deadline based on simulated hospital clock.
    If breached, advances state to 'Escalated', reassigns owner, and sets new deadline.
    """
    state = loop.get("state", "Opened")
    if state in ["Closed", "Acted"]:
        return {"escalated": False, "loop": loop}

    deadline_str = loop.get("deadline")
    if not deadline_str:
        return {"escalated": False, "loop": loop}

    deadline = datetime.fromisoformat(deadline_str)
    
    if simulated_now > deadline:
        urgency = loop.get("urgency", "routine")
        current_owner = loop.get("owner", "dr.okonkwo")
        new_owner = next_escalation_owner(current_owner)
        escalation_count = loop.get("escalation_count", 0) + 1

        # Grant new SLA window for escalated owner
        hours_to_add = SLA_LIMITS.get(urgency, {}).get("owned_hours", 4)
        new_deadline = simulated_now + timedelta(hours=hours_to_add)

        updated_loop = dict(loop)
        updated_loop["state"] = "Escalated"
        updated_loop["owner"] = new_owner
        updated_loop["escalation_count"] = escalation_count
        updated_loop["deadline"] = new_deadline.isoformat()
        updated_loop["last_escalated_at"] = simulated_now.isoformat()

        return {
            "escalated": True,
            "previous_owner": current_owner,
            "new_owner": new_owner,
            "escalation_count": escalation_count,
            "loop": updated_loop
        }

    return {"escalated": False, "loop": loop}

def accept_loop_ownership(loop: Dict[str, Any], clinician_user: str) -> Dict[str, Any]:
    """
    Clinician accepts ownership of loop (via REST or Workflow Inbox).
    Transitions state to 'Owned', locking owner to the accepting clinician.
    """
    updated = dict(loop)
    updated["state"] = "Owned"
    updated["owner"] = clinician_user
    urgency = loop.get("urgency", "routine")
    
    # SLA deadline to become 'Acted'
    acted_hours = SLA_LIMITS.get(urgency, {}).get("acted_hours", 4)
    now = datetime.now()
    updated["deadline"] = (now + timedelta(hours=acted_hours)).isoformat()
    return updated
