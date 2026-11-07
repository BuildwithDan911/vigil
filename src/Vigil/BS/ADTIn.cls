/// Vigil.BS.ADTIn - Inbound HL7 ADT business service for patient admission and discharge events
Class Vigil.BS.ADTIn Extends Ens.BusinessService
{

Method OnProcessInput(pInput As %Stream.Object, Output pOutput As %RegisteredObject) As %Status
{
    Set sc = $$$OK
    Try {
        // Read raw string from stream
        Set raw = ""
        If $IsObject(pInput) {
            While 'pInput.AtEnd { Set raw = raw _ pInput.Read() }
        } Else {
            Set raw = pInput
        }
        
        Set msg = ##class(EnsLib.HL7.Message).ImportFromString(raw, .sc)
        If $$$ISERR(sc) Quit
        
        Set mshType = msg.GetValueAt("MSH:9.2") // A01 or A03
        Set patientId = msg.GetValueAt("PID:3.1")
        If patientId = "" Set patientId = msg.GetValueAt("PID:3")
        Set familyName = msg.GetValueAt("PID:5.1")
        Set givenName = msg.GetValueAt("PID:5.2")
        Set dobStr = msg.GetValueAt("PID:7")
        Set sex = msg.GetValueAt("PID:8")
        Set ward = msg.GetValueAt("PV1:3.1")
        Set visitId = msg.GetValueAt("PV1:19")
        If visitId = "" Set visitId = "ENC-" _ patientId
        
        // Upsert Patient record
        Set pat = ##class(Vigil.Data.Patient).IdxPatientIdOpen(patientId)
        If '$IsObject(pat) {
            Set pat = ##class(Vigil.Data.Patient).%New()
            Set pat.PatientId = patientId
        }
        If familyName '= "" Set pat.FamilyName = familyName
        If givenName '= "" Set pat.GivenName = givenName
        If sex '= "" Set pat.Sex = sex
        If ward '= "" Set pat.CurrentWard = ward
        Do pat.%Save()
        
        // Upsert Encounter record
        Set enc = ##class(Vigil.Data.Encounter).IdxEncounterIdOpen(visitId)
        If '$IsObject(enc) {
            Set enc = ##class(Vigil.Data.Encounter).%New()
            Set enc.EncounterId = visitId
            Set enc.PatientId = patientId
        }
        If ward '= "" Set enc.Ward = ward
        
        If mshType = "A01" {
            Set admitTime = msg.GetValueAt("PV1:44")
            If admitTime = "" Set admitTime = msg.GetValueAt("MSH:7")
            Set enc.AdmitTime = ..NormalizeTime(admitTime)
            Set enc.Status = "admitted"
        } ElseIf mshType = "A03" {
            Set dischargeTime = msg.GetValueAt("PV1:45")
            If dischargeTime = "" Set dischargeTime = msg.GetValueAt("MSH:7")
            Set enc.DischargeTime = ..NormalizeTime(dischargeTime)
            Set enc.Status = "discharged"
        }
        Set sc = enc.%Save()
        
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

ClassMethod NormalizeTime(hl7Time As %String) As %String
{
    If $Length(hl7Time) >= 14 {
        Quit $Extract(hl7Time,1,4)_"-"_$Extract(hl7Time,5,6)_"-"_$Extract(hl7Time,7,8)_" "_$Extract(hl7Time,9,10)_":"_$Extract(hl7Time,11,12)_":"_$Extract(hl7Time,13,14)
    }
    Quit $ZDateTime($Horolog, 3)
}

}
