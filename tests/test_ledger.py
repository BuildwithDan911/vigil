"""
test_ledger.py - Phase 10 Cryptographic Ledger Verification and Tamper Detection
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "python"))

from vigil.ledger import LedgerChain, compute_record_hash, canonical_json

def test_ledger():
    chain = LedgerChain()
    
    # 1. Append valid sequence of events
    r1 = chain.append("VGL-01-REEVE", "opened", "rules_floor", {"urgency": "critical", "score": 9})
    assert r1.seq == 1
    assert r1.prev_hash == "0" * 64
    
    r2 = chain.append("VGL-02-OKAI", "owned", "user:dr.mensah", {"action": "accept"})
    assert r2.seq == 2
    assert r2.prev_hash == r1.record_hash
    
    r3 = chain.append("VGL-15-CONTEH", "escalated", "system", {"sla": "2h_breached"})
    assert r3.seq == 3
    assert r3.prev_hash == r2.record_hash
    
    # 2. Verify untouched chain
    ok, bad_seq, msg = chain.verify()
    assert ok is True
    assert bad_seq is None
    
    # 3. Simulate tamper on block 2
    chain.chain[1].payload["action"] = "adversarial_tamper"
    ok_tamper, bad_seq, err_msg = chain.verify()
    assert ok_tamper is False
    assert bad_seq == 2
    assert "Corrupted hash" in err_msg
    
    # 4. Repair block 2 and test prev_hash manipulation
    chain.chain[1].payload["action"] = "accept"  # restore payload
    chain.chain[2].prev_hash = "deadbeef" * 8    # tamper prev_hash
    ok_prev, bad_prev_seq, err_prev = chain.verify()
    assert ok_prev is False
    assert bad_prev_seq == 3
    assert "PrevHash mismatch" in err_prev
    
    print("[PASS] Phase 10 Cryptographic Ledger & Tamper Detection verified.")

if __name__ == "__main__":
    test_ledger()
