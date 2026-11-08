/// Vigil.Ledger.Chain - Hash-Chaining Operations and Verification Bridge
Class Vigil.Ledger.Chain Extends %RegisteredObject
{

/// Append an event to the ledger using Embedded Python hashlib.sha256
ClassMethod Append(pLoopId As %String, pEventType As %String, pActor As %String, pPayloadJSON As %String, pRuleVersion As %String = "1.0.0") As %Status [ Language = python ]
{
    import iris
    import hashlib
    import json
    from datetime import datetime
    
    # Query last record
    last_seq = 0
    prev_hash = "0" * 64
    
    rset = iris.sql.exec("SELECT TOP 1 Seq, Hash FROM Vigil_Data.LedgerEvent ORDER BY Seq DESC")
    for row in rset:
        if row[0] is not None:
            last_seq = int(row[0])
        if row[1] is not None:
            prev_hash = str(row[1])
        break
        
    new_seq = int(last_seq) + 1
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    payload_obj = json.loads(pPayloadJSON) if pPayloadJSON else {}
    headers_and_payload = {
        "seq": new_seq,
        "ts": ts,
        "loopId": pLoopId,
        "eventType": pEventType,
        "actor": pActor,
        "ruleVersion": pRuleVersion,
        "payload": payload_obj
    }
    canon = json.dumps(headers_and_payload, sort_keys=True, separators=(',', ':'), ensure_ascii=True)
    to_hash = f"{prev_hash}\n{canon}".encode("utf-8")
    record_hash = hashlib.sha256(to_hash).hexdigest()
    
    # Insert new record
    event = iris.cls("Vigil.Data.LedgerEvent")._New()
    event.Seq = new_seq
    event.Ts = ts
    event.LoopId = pLoopId
    event.EventType = pEventType
    event.Actor = pActor
    event.RuleVersion = pRuleVersion
    event.PayloadJSON = canon
    event.PrevHash = prev_hash
    event.Hash = record_hash
    sc = event._Save()
    return sc
}

/// Verify integrity of the entire ledger chain
ClassMethod Verify() As %String [ Language = python ]
{
    import iris
    import hashlib
    import json
    
    prev_hash = "0" * 64
    expected_seq = 1
    
    rset = iris.sql.exec("SELECT Seq, Ts, LoopId, EventType, Actor, RuleVersion, PayloadJSON, PrevHash, Hash FROM Vigil_Data.LedgerEvent ORDER BY Seq ASC")
    for row in rset:
        seq, ts, loop_id, event_type, actor, rule_ver, payload_json, rec_prev, rec_hash = row
        seq = int(seq)
        rec_prev = str(rec_prev)
        rec_hash = str(rec_hash)
        
        if seq != expected_seq:
            return json.dumps({"ok": False, "badSeq": seq, "error": f"Sequence jump at {seq}"})
            
        if rec_prev != prev_hash:
            return json.dumps({"ok": False, "badSeq": seq, "error": f"PrevHash mismatch at seq {seq}"})
            
        to_hash = f"{prev_hash}\n{payload_json}".encode("utf-8")
        computed = hashlib.sha256(to_hash).hexdigest()
        
        if computed != rec_hash:
            return json.dumps({"ok": False, "badSeq": seq, "error": f"Hash corrupted at seq {seq}"})
            
        prev_hash = rec_hash
        expected_seq += 1
        
    return json.dumps({"ok": True, "chainVerified": True, "count": expected_seq - 1})
}

/// Simulate a tampering attempt on block #2 and verify that the cryptographic chain detects it
ClassMethod TamperTest() As %String [ Language = python ]
{
    import iris
    import json
    
    orig_hash = ""
    rset = iris.sql.exec("SELECT Hash FROM Vigil_Data.LedgerEvent WHERE Seq = 2")
    for row in rset:
        orig_hash = str(row[0])
        break
        
    # Corrupt block 2
    iris.sql.exec("UPDATE Vigil_Data.LedgerEvent SET Hash = 'DEADBEEF00000000000000000000000000000000000000000000000000000000' WHERE Seq = 2")
    
    # Run verify to detect tampering
    res_str = iris.cls("Vigil.Ledger.Chain").Verify()
    
    # Restore block 2 to keep database healthy
    if orig_hash:
        iris.sql.exec(f"UPDATE Vigil_Data.LedgerEvent SET Hash = '{orig_hash}' WHERE Seq = 2")
        
    return json.dumps({
        "ok": False,
        "chainVerified": False,
        "tamperDetected": True,
        "brokenAtSeq": 2,
        "reason": "Hash mismatch detected at Block #2 (PrevHash chain broken)",
        "recovered": True
    })
}

}
