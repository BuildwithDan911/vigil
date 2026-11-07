/// Vigil.BP.VigilProcess - Central Business Process coordinating Risk Score, Loop lifecycle, and Escalation
Class Vigil.BP.VigilProcess Extends Ens.BusinessProcess [ ClassType = persistent ]
{

Method OnRequest(pRequest As Ens.StringRequest, Output pResponse As Ens.StringResponse) As %Status
{
    Set sc = $$$OK
    Set pResponse = ##class(Ens.StringResponse).%New()
    
    Try {
        Set rawInput = pRequest.StringValue
        
        // Check if referral message
        If $Extract(rawInput, 1, 9) = "REFERRAL|" {
            Set sc = ..ProcessReferral(rawInput, .pResponse)
            Quit
        }
        
        // Otherwise handle lab results: accession|patientId
        Set token1 = $Piece(rawInput, "|", 1)
        Set patientId = $Piece(rawInput, "|", 2)
        
        // 1. Fetch patient
        Set pat = ##class(Vigil.Data.Patient).IdxPatientIdOpen(patientId)
        If '$IsObject(pat) {
            Set pResponse.StringValue = "SKIP:patient_not_found"
            Quit
        }
        
        // 2. Fetch latest encounter to check discharge status
        Set rset = ##class(%SQL.Statement).%ExecDirect(, "SELECT TOP 1 DischargeTime, Status FROM Vigil_Data.Encounter WHERE PatientId = ? ORDER BY ID DESC", patientId)
        Set dischargeTime = ""
        Set encStatus = ""
        If $IsObject(rset) && rset.%Next() {
            Set dischargeTime = rset.%Get("DischargeTime")
            Set encStatus = rset.%Get("Status")
        }
        
        // If inpatient (no discharge time or admitted), skip loop per risk-score spec
        If (dischargeTime = "") || (encStatus = "admitted") {
            Set pResponse.StringValue = "SKIP:not_discharged"
            Quit
        }
        
        // 3. Collect observations for this accession
        Set obsArray = []
        Set oset = ##class(%SQL.Statement).%ExecDirect(, "SELECT TestCode, TestName, NumericValue, Flag, RefRange, ResultTime FROM Vigil_Data.Observation WHERE Accession = ?", token1)
        Set resultTime = ""
        If $IsObject(oset) {
            While oset.%Next() {
                Set resultTime = oset.%Get("ResultTime")
                Do obsArray.%Push({
                    "test_code": (oset.%Get("TestCode")),
                    "test_name": (oset.%Get("TestName")),
                    "numeric_value": (oset.%Get("NumericValue")),
                    "flag": (oset.%Get("Flag")),
                    "ref_range": (oset.%Get("RefRange"))
                })
            }
        }
        
        If resultTime = "" Set resultTime = $ZDateTime($Horolog, 3)
        
        // 4. Calculate Risk Score & Floor via Embedded Python
        Set age = 40
        If pat.DOB '= "" {
            Set age = ($Piece($ZDateTime($Horolog,8), " ", 1) - $Piece($ZDateTime(pat.DOB,8), " ", 1)) \ 10000
        }
        
        Set scoreJsonStr = ##class(Vigil.Score.Engine).ScoreObservations(obsArray.%ToJSON(), dischargeTime, resultTime, age, pat.LivesAlone, "dr.okonkwo")
        Set scoreObj = {}.%FromJSON(scoreJsonStr)
        
        If scoreObj.skip {
            Set pResponse.StringValue = "SKIP:" _ scoreObj.reason
            Quit
        }
        
        // If band is no_action, skip creating open loop per spec
        If scoreObj.final_level = "no_action" {
            Set pResponse.StringValue = "SKIP:no_action"
            Quit
        }
        
        // 5. Deduplication check
        Set existing = ##class(Vigil.Data.Loop).IdxDedupeOpen("results_after_discharge", patientId, token1)
        If $IsObject(existing) {
            Set pResponse.StringValue = "DEDUPE:" _ existing.LoopId
            Quit
        }
        
        // 6. Create new Loop
        Set loop = ##class(Vigil.Data.Loop).%New()
        Set loop.LoopId = "VGL-" _ $Extract($ZCRC(patientId_token1, 7), 1, 8)
        Set loop.Type = "results_after_discharge"
        Set loop.PatientId = patientId
        Set loop.AccessionOrReferralId = token1
        Set loop.Urgency = scoreObj.final_level
        Set loop.FloorLevel = scoreObj.floor_level
        Set loop.Score = scoreObj.score
        Set loop.State = "Opened"
        Set loop.Owner = scoreObj.recommended_owner
        Set loop.DaysSinceDischarge = scoreObj.days_since_discharge_raw
        Set loop.Reason = "Post-discharge result: Flag " _ scoreObj.max_flag _ " (" _ scoreObj.final_level _ " urgency)."
        Set loop.DecisionSource = "rules_floor"
        Set loop.CreatedAt = $ZDateTime($Horolog, 3)
        
        // Set deadline based on urgency (critical: 2h, urgent: 8h, routine: 24h)
        Set hours = 24
        If loop.Urgency = "critical" Set hours = 2
        If loop.Urgency = "urgent" Set hours = 8
        Set loop.Deadline = $ZDateTime($H + (hours/24), 3)
        
        // Save Loop
        Set sc = loop.%Save()
        Set pResponse.StringValue = "OPENED:" _ loop.LoopId
        
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

/// Evaluates Referral event
Method ProcessReferral(rawInput As %String, ByRef pResponse As Ens.StringResponse) As %Status
{
    Set sc = $$$OK
    Try {
        Set patientId = $Piece(rawInput, "|", 2)
        Set refJson = $Piece(rawInput, "|", 3, *)
        Set ref = {}.%FromJSON(refJson)
        
        If ref.bookingStatus = "booked" {
            Set pResponse.StringValue = "SKIP:already_booked"
            Quit
        }
        
        Set loopId = "VGL-REF-" _ $Extract($ZCRC(patientId_ref.referralId, 7), 1, 6)
        
        // Deduplication
        Set existing = ##class(Vigil.Data.Loop).IdxDedupeOpen("referral_leakage", patientId, ref.referralId)
        If $IsObject(existing) {
            Set pResponse.StringValue = "DEDUPE:" _ existing.LoopId
            Quit
        }
        
        Set loop = ##class(Vigil.Data.Loop).%New()
        Set loop.LoopId = loopId
        Set loop.Type = "referral_leakage"
        Set loop.PatientId = patientId
        Set loop.AccessionOrReferralId = ref.referralId
        Set loop.Urgency = "urgent"
        Set loop.FloorLevel = "urgent"
        Set loop.Score = 7
        Set loop.State = "Opened"
        Set loop.Owner = "dr.mensah"
        Set loop.Reason = "Referral leakage: Unbooked consultation for " _ ref.specialty _ " at " _ ref.referredTo
        Set loop.DecisionSource = "rules"
        Set loop.CreatedAt = $ZDateTime($Horolog, 3)
        Set loop.Deadline = $ZDateTime($H + (8/24), 3) // 8 hours SLA for urgent referral chase
        
        If ref.share_results_sms = 0 {
            Set loop.ConsentStatus = "hold"
        } Else {
            Set loop.ConsentStatus = "send"
        }
        
        Set sc = loop.%Save()
        Set pResponse.StringValue = "OPENED:" _ loop.LoopId
        
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

Storage Default
{
<Type>%Storage.Persistent</Type>
}

}
