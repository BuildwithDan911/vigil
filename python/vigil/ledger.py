"""
ledger.py - Cryptographic SHA-256 Loop Ledger Hash Chaining Engine
(c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
"""
import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

GENESIS_PREV_HASH = "0" * 64

def canonical_json(data: Any) -> str:
    """Produces canonical JSON: sorted keys, no whitespace separators."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=True)

def compute_record_hash(prev_hash: str, headers_and_payload: Dict[str, Any]) -> str:
    """
    Computes hex SHA-256 hash: PrevHash + '\n' + canonical(headers_and_payload)
    """
    canon = canonical_json(headers_and_payload)
    to_hash = f"{prev_hash}\n{canon}".encode("utf-8")
    return hashlib.sha256(to_hash).hexdigest()

@dataclass
class LedgerRecord:
    seq: int
    ts: str
    loop_id: str
    event_type: str
    actor: str
    rule_version: str
    payload: Dict[str, Any]
    prev_hash: str
    record_hash: str

class LedgerChain:
    def __init__(self):
        self.chain: List[LedgerRecord] = []

    def append(self, loop_id: str, event_type: str, actor: str, payload: Dict[str, Any], ts: Optional[str] = None, rule_version: str = "1.0.0") -> LedgerRecord:
        seq = len(self.chain) + 1
        current_ts = ts if ts else datetime.utcnow().isoformat() + "Z"
        prev_hash = self.chain[-1].record_hash if self.chain else GENESIS_PREV_HASH
        
        headers_and_payload = {
            "seq": seq,
            "ts": current_ts,
            "loopId": loop_id,
            "eventType": event_type,
            "actor": actor,
            "ruleVersion": rule_version,
            "payload": payload
        }
        
        rec_hash = compute_record_hash(prev_hash, headers_and_payload)
        
        record = LedgerRecord(
            seq=seq,
            ts=current_ts,
            loop_id=loop_id,
            event_type=event_type,
            actor=actor,
            rule_version=rule_version,
            payload=payload,
            prev_hash=prev_hash,
            record_hash=rec_hash
        )
        self.chain.append(record)
        return record

    def verify(self) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Walks the chain and verifies every link:
        1. seq starts at 1 and increments by 1
        2. prev_hash matches prior record's record_hash (or 64 zeros for seq 1)
        3. record_hash matches sha256(prev_hash + '\n' + canonical_json)
        """
        for i, rec in enumerate(self.chain):
            expected_seq = i + 1
            if rec.seq != expected_seq:
                return False, rec.seq, f"Invalid sequence index. Expected {expected_seq}, got {rec.seq}"
            
            expected_prev = GENESIS_PREV_HASH if i == 0 else self.chain[i - 1].record_hash
            if rec.prev_hash != expected_prev:
                return False, rec.seq, f"PrevHash mismatch at seq {rec.seq}."
            
            headers_and_payload = {
                "seq": rec.seq,
                "ts": rec.ts,
                "loopId": rec.loop_id,
                "eventType": rec.event_type,
                "actor": rec.actor,
                "ruleVersion": rec.rule_version,
                "payload": rec.payload
            }
            computed_hash = compute_record_hash(rec.prev_hash, headers_and_payload)
            if computed_hash != rec.record_hash:
                return False, rec.seq, f"Corrupted hash at seq {rec.seq}. Expected {computed_hash}, got {rec.record_hash}"

        return True, None, "Chain verified successfully"

if __name__ == "__main__":
    chain = LedgerChain()
    chain.append("VGL-01-REEVE", "opened", "rules_floor", {"urgency": "critical", "score": 9})
    chain.append("VGL-02-OKAI", "owned", "user:dr.mensah", {"action": "accept"})
    chain.append("VGL-15-CONTEH", "escalated", "system", {"sla_missed": "2h"})
    
    ok, bad_seq, msg = chain.verify()
    assert ok, f"Verification failed: {msg}"
    print(f"[PASS] Ledger verification passed: {msg}")
    
    # Simulate tamper
    chain.chain[1].payload["action"] = "tampered"
    ok_tamper, bad_seq, msg_tamper = chain.verify()
    assert not ok_tamper
    assert bad_seq == 2
    print(f"[PASS] Tamper correctly caught at sequence {bad_seq}: {msg_tamper}")
