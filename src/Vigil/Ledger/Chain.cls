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
        last_seq = row[0]
        prev_hash = row[1]
        break
        
    new_seq = last_seq + 1
    ts = datetime.utcnow().isoformat() + "Z"
    
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
ClassMethod Verify() As %DynamicObject [ Language = python ]
{
    import iris
    import hashlib
    import json
    
    result = iris.cls("%DynamicObject")._New()
    prev_hash = "0" * 64
    expected_seq = 1
    
    rset = iris.sql.exec("SELECT Seq, Ts, LoopId, EventType, Actor, RuleVersion, PayloadJSON, PrevHash, Hash FROM Vigil_Data.LedgerEvent ORDER BY Seq ASC")
    for row in rset:
        seq, ts, loop_id, event_type, actor, rule_ver, payload_json, rec_prev, rec_hash = row
        
        if seq != expected_seq:
            result.ok = False
            result.badSeq = seq
            result.error = f"Sequence jump at {seq}"
            return result
            
        if rec_prev != prev_hash:
            result.ok = False
            result.badSeq = seq
            result.error = f"PrevHash mismatch at seq {seq}"
            return result
            
        payload_obj = json.loads(payload_json) if payload_json else {}
        headers_and_payload = {
            "seq": seq,
            "ts": ts,
            "loopId": loop_id,
            "eventType": event_type,
            "actor": actor,
            "ruleVersion": rule_ver,
            "payload": payload_obj
        }
        canon = json.dumps(headers_and_payload, sort_keys=True, separators=(',', ':'), ensure_ascii=True)
        to_hash = f"{prev_hash}\n{canon}".encode("utf-8")
        computed = hashlib.sha256(to_hash).hexdigest()
        
        if computed != rec_hash:
            result.ok = False
            result.badSeq = seq
            result.error = f"Hash corrupted at seq {seq}"
            return result
            
        prev_hash = rec_hash
        expected_seq += 1
        
    result.ok = True
    result.count = expected_seq - 1
    return result
}

}
