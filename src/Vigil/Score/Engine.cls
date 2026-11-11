/// Vigil.Score.Engine - Embedded Python calculation of clinical risk score and safety floor
Class Vigil.Score.Engine Extends %RegisteredObject
{

/// Calls Embedded Python calculate_risk
ClassMethod ScoreObservations(obsJson As %String, dischargeIso As %String, resultIso As %String, age As %Integer, livesAlone As %Boolean, owner As %String = "dr.okonkwo") As %String [ Language = python ]
{
    import json
    import os
    from datetime import datetime
    import sys

    for p in [os.environ.get("DEV_HOME", ""), "/home/irisowner/dev", "/irisdev/app"]:
        py_dir = os.path.join(p, "python") if p else ""
        if py_dir and os.path.isdir(py_dir) and py_dir not in sys.path:
            sys.path.insert(0, py_dir)
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
