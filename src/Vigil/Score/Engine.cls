/// Vigil.Score.Engine - Embedded Python calculation of clinical risk score and safety floor
Class Vigil.Score.Engine Extends %RegisteredObject
{

/// Calls Embedded Python calculate_risk
ClassMethod ScoreObservations(obsJson As %String, dischargeIso As %String, resultIso As %String, age As %Integer, livesAlone As %Boolean, owner As %String = "dr.okonkwo") As %String [ Language = python ]
{
    import json
    from datetime import datetime
    import sys
    sys.path.append("/home/irisowner/dev/python")
    from vigil.risk_score import calculate_risk

    obs = json.loads(obsJson) if obsJson else []
    dis_dt = datetime.fromisoformat(dischargeIso) if dischargeIso else None
    res_dt = datetime.fromisoformat(resultIso) if resultIso else datetime.now()

    result = calculate_risk(
        observations=obs,
        discharge_dt=dis_dt,
        result_dt=res_dt,
        age=int(age),
        lives_alone=bool(livesAlone),
        owner=owner
    )
    return json.dumps(result)
}

}
