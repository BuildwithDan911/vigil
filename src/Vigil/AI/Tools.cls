/// Vigil.AI.Tools - Read-only safe tools exposed to IRIS AI Hub Agent
Class Vigil.AI.Tools Extends %RegisteredObject
{

/// GetScoreBreakdown: Returns the deterministic score components computed for a loop
ClassMethod GetScoreBreakdown(loopId As %String) As %String
{
    Set loop = ##class(Vigil.Data.Loop).IdxLoopIdOpen(loopId)
    If '$IsObject(loop) Quit "{}"
    Set obj = {
        "score": (loop.Score),
        "floorLevel": (loop.FloorLevel),
        "urgency": (loop.Urgency),
        "reason": (loop.Reason)
    }
    Quit obj.%ToJSON()
}

/// GetRoster: Returns active on-shift clinician and backup
ClassMethod GetRoster(ward As %String = "4W", atHour As %Integer = 20) As %String
{
    Set isDay = (atHour >= 7) && (atHour < 19)
    Set obj = {
        "ward": (ward),
        "primaryOwner": ($Select(isDay: "dr.okonkwo", 1: "dr.mensah")),
        "backupOwner": ($Select(isDay: "dr.mensah", 1: "dr.okonkwo")),
        "headOfDepartment": "dr.adewale"
    }
    Quit obj.%ToJSON()
}

/// GetConsent: Returns patient privacy sharing flags
ClassMethod GetConsent(patientId As %String) As %String
{
    Set pat = ##class(Vigil.Data.Patient).IdxPatientIdOpen(patientId)
    If '$IsObject(pat) Quit "{}"
    Set obj = {
        "patientId": (patientId),
        "shareResultsSms": (pat.ShareResultsSms),
        "shareSensitive": (pat.ShareSensitive),
        "preferredLanguage": (pat.PreferredLanguage)
    }
    Quit obj.%ToJSON()
}

}
