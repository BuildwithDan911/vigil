/// Vigil.Setup - IPM Installation and Production Setup Hook
Class Vigil.Setup Extends %RegisteredObject
{

ClassMethod Run() As %Status
{
    Set sc = $$$OK
    Write !, "==> Initializing Vigil for IRIS for Health configuration..."
    
    Try {
        // 1. Configure CSP REST Web Application /vigil
        Set namespace = $Namespace
        New $Namespace
        Set $Namespace = "%SYS"
        
        Do ##class(Security.Users).UnExpireUserPasswords("*")
        
        Set appPath = "/vigil"
        Set props("AutheEnabled") = 96 // 32 (Unauthenticated) + 64 (Password)
        Set props("MatchRoles") = ":%All"
        Set props("NameSpace") = namespace
        Set props("DispatchClass") = "Vigil.Web.Dispatcher"
        Set props("IsNameSpaceDefault") = 0
        If '##class(Security.Applications).Exists(appPath) {
            Set sc = ##class(Security.Applications).Create(appPath, .props)
            Write !, "  -> Created REST Web Application: ", appPath
        } Else {
            Set sc = ##class(Security.Applications).Modify(appPath, .props)
            Write !, "  -> Updated REST Web Application: ", appPath
        }
        
        // 2. Compile Production
        Set $Namespace = namespace
        Set sc = $System.OBJ.Compile("Vigil.Production", "ck")
        If $$$ISOK(sc) {
            Write !, "  -> Vigil production compiled successfully."
        } Else {
            Write !, "  [ERROR] Production compilation failed: ", $System.Status.GetErrorText(sc)
        }
        
        // 3. Seed demonstration clinical cases into IRIS storage
        Do ..SeedDemoData()
        
        // 4. Start Production if not already running (ensures ZPM/IPM installs auto-start)
        If '##class(Ens.Director).IsProductionRunning() {
            Set scProd = ##class(Ens.Director).StartProduction("Vigil.Production")
            If $$$ISOK(scProd) {
                Write !, "  -> Vigil.Production started automatically."
            }
        }
        
    } Catch ex {
        Set sc = ex.AsStatus()
        Write !, "  [ERROR] Setup encountered: ", $System.Status.GetErrorText(sc)
    }
    
    Write !, "==> Vigil Setup Completed: ", $Select($$$ISOK(sc):"OK", 1:"FAILED"), !
    Quit sc
}

ClassMethod SeedDemoData() As %Status
{
    Set sc = $$$OK
    Set count = 0
    &sql(SELECT COUNT(*) INTO :count FROM Vigil_Data.Loop)
    If count > 0 Quit $$$OK
    
    Write !, "  -> Seeding demonstration patient cases in Vigil_Data.Loop..."
    
    // 1. Martha Reeve
    Set l1 = ##class(Vigil.Data.Loop).%New()
    Set l1.LoopId = "VGL-01-REEVE"
    Set l1.PatientId = "P01"
    Set l1.PatientName = "Martha Reeve (78y)"
    Set l1.Ward = "Ward 4W"
    Set l1.Type = "results_after_discharge"
    Set l1.Urgency = "critical"
    Set l1.FloorLevel = "critical"
    Set l1.State = "Opened"
    Set l1.Owner = "dr.mensah"
    Set l1.Score = 9
    Set l1.Reason = "Critical high potassium 1 day after discharge. High clinical vulnerability (age 78, lives alone). Primary doctor off-duty."
    Set l1.TestName = "Potassium (Serum)"
    Set l1.TestValue = "6.8 mmol/L (Severe Hyperkalemia)"
    Set l1.ReferenceRange = "3.5 - 5.0 mmol/L"
    Set l1.SlaRemaining = "01h 48m"
    Set l1.SlaSeconds = 6480
    Set l1.DecisionSource = "medical_safety_guard"
    Set l1.DaysSinceDischarge = 1
    Set l1.CreatedAt = $ZDateTime($Horolog, 3)
    Set l1.Deadline = $ZDateTime($Horolog, 3)
    Set l1.CallScript = "Hello, this is Harbourview General calling for Martha Reeve regarding a recent lab test. Please could Martha or their carer contact our clinical nurse coordinator on 0800-427-268 today."
    Do l1.%Save()
    Do ##class(Vigil.Ledger.Chain).Append("VGL-01-REEVE", "LOOP_OPENED", "Vigil.Engine", "{""urgency"":""critical"",""score"":9,""floor"":""critical""}")

    // 2. Amina Diallo
    Set l2 = ##class(Vigil.Data.Loop).%New()
    Set l2.LoopId = "VGL-REF-ONC"
    Set l2.PatientId = "R01"
    Set l2.PatientName = "Amina Diallo (82y)"
    Set l2.Ward = "Oncology Clinic"
    Set l2.Type = "referral_leakage"
    Set l2.Urgency = "urgent"
    Set l2.FloorLevel = "urgent"
    Set l2.State = "Opened"
    Set l2.Owner = "dr.mensah"
    Set l2.Score = 7
    Set l2.Reason = "Urgent oncology referral unbooked for 55 hours (exceeds 48-hour safety target). Discharging doctor off-duty."
    Set l2.TestName = "Specialist Referral"
    Set l2.TestValue = "Urgent Oncology Consultation"
    Set l2.ReferenceRange = "Target SLA: 48h"
    Set l2.SlaRemaining = "06h 15m"
    Set l2.SlaSeconds = 22500
    Set l2.DecisionSource = "medical_safety_guard"
    Set l2.DaysSinceDischarge = 3
    Set l2.CreatedAt = $ZDateTime($Horolog, 3)
    Set l2.Deadline = $ZDateTime($Horolog, 3)
    Do l2.%Save()
    Do ##class(Vigil.Ledger.Chain).Append("VGL-REF-ONC", "LOOP_OPENED", "Vigil.Engine", "{""urgency"":""urgent"",""score"":7,""floor"":""urgent""}")

    // 3. Samuel Okai
    Set l3 = ##class(Vigil.Data.Loop).%New()
    Set l3.LoopId = "VGL-02-OKAI"
    Set l3.PatientId = "P02"
    Set l3.PatientName = "Samuel Okai (67y)"
    Set l3.Ward = "Cardiology Unit"
    Set l3.Type = "results_after_discharge"
    Set l3.Urgency = "critical"
    Set l3.FloorLevel = "critical"
    Set l3.State = "Owned"
    Set l3.Owner = "dr.mensah"
    Set l3.Score = 8
    Set l3.Reason = "Troponin I 2.4 ng/mL day of discharge indicating acute myocardial injury. Dr. Mensah accepted case ownership."
    Set l3.TestName = "Troponin I (High Sens)"
    Set l3.TestValue = "2.4 ng/mL (Cardiac Injury)"
    Set l3.ReferenceRange = "< 0.04 ng/mL"
    Set l3.SlaRemaining = "03h 12m"
    Set l3.SlaSeconds = 11520
    Set l3.DecisionSource = "clinical_ai"
    Set l3.DaysSinceDischarge = 0
    Set l3.CreatedAt = $ZDateTime($Horolog, 3)
    Set l3.Deadline = $ZDateTime($Horolog, 3)
    Do l3.%Save()
    Do ##class(Vigil.Ledger.Chain).Append("VGL-02-OKAI", "LOOP_OPENED", "Vigil.Engine", "{""urgency"":""critical"",""score"":8}")
    Do ##class(Vigil.Ledger.Chain).Append("VGL-02-OKAI", "LOOP_ACCEPTED", "dr.mensah", "{""action"":""accepted_ownership""}")

    // 4. Elena Rostova
    Set l4 = ##class(Vigil.Data.Loop).%New()
    Set l4.LoopId = "VGL-REF-CARD"
    Set l4.PatientId = "R03"
    Set l4.PatientName = "Elena Rostova (71y)"
    Set l4.Ward = "Cardiology Outpatient"
    Set l4.Type = "referral_leakage"
    Set l4.Urgency = "urgent"
    Set l4.FloorLevel = "urgent"
    Set l4.State = "Escalated"
    Set l4.Owner = "dr.adewale"
    Set l4.Score = 8
    Set l4.Reason = "Post-infarct Echocardiogram unbooked for 16 days (SLA breached by 48h). Escalated to Clinical Director Dr. Adewale."
    Set l4.TestName = "Transthoracic Echo"
    Set l4.TestValue = "Follow-up Post-STEMI EF Check"
    Set l4.ReferenceRange = "Target SLA: 14d"
    Set l4.SlaRemaining = "OVERDUE (2d 04h)"
    Set l4.SlaSeconds = -187200
    Set l4.DecisionSource = "escalation_clock"
    Set l4.DaysSinceDischarge = 16
    Set l4.CreatedAt = $ZDateTime($Horolog, 3)
    Set l4.Deadline = $ZDateTime($Horolog, 3)
    Do l4.%Save()
    Do ##class(Vigil.Ledger.Chain).Append("VGL-REF-CARD", "LOOP_OPENED", "Vigil.Engine", "{""urgency"":""urgent"",""score"":8}")
    Do ##class(Vigil.Ledger.Chain).Append("VGL-REF-CARD", "LOOP_ESCALATED", "Vigil.EscalationLadder", "{""action"":""escalated_to_dept_head"",""target"":""dr.adewale""}")

    // 5. David Kim
    Set l5 = ##class(Vigil.Data.Loop).%New()
    Set l5.LoopId = "VGL-03-KIM"
    Set l5.PatientId = "P03"
    Set l5.PatientName = "David Kim (45y)"
    Set l5.Ward = "Ambulatory Care"
    Set l5.Type = "results_after_discharge"
    Set l5.Urgency = "urgent"
    Set l5.FloorLevel = "urgent"
    Set l5.State = "Acted"
    Set l5.Owner = "dr.mensah"
    Set l5.Score = 6
    Set l5.Reason = "Serum Digoxin level 2.8 ng/mL (toxic range > 2.0). Patient contacted by phone, instructed to hold next dose and report to clinic."
    Set l5.TestName = "Digoxin Level"
    Set l5.TestValue = "2.8 ng/mL (Toxic Elevation)"
    Set l5.ReferenceRange = "0.8 - 2.0 ng/mL"
    Set l5.SlaRemaining = "Resolved"
    Set l5.SlaSeconds = 0
    Set l5.DecisionSource = "clinical_ai"
    Set l5.DaysSinceDischarge = 2
    Set l5.CreatedAt = $ZDateTime($Horolog, 3)
    Set l5.Deadline = $ZDateTime($Horolog, 3)
    Do l5.%Save()
    Do ##class(Vigil.Ledger.Chain).Append("VGL-03-KIM", "LOOP_OPENED", "Vigil.Engine", "{""urgency"":""urgent"",""score"":6}")
    Do ##class(Vigil.Ledger.Chain).Append("VGL-03-KIM", "LOOP_CONTACTED", "dr.mensah", "{""action"":""patient_contacted_phone""}")

    Write !, "  -> Seeded 5 demonstration loops and initial SHA-256 ledger blocks."
    Quit $$$OK
}

ClassMethod HealthCheck() As %Status
{
    Set sc = $$$OK
    Try {
        Set status = ""
        Do ##class(Ens.Director).GetProductionStatus(.prodName, .status)
        If prodName '= "Vigil.Production" {
            Quit
        }
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

}
