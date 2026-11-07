/// Vigil.BS.ORUIn - Inbound HL7 ORU^R01 business service for laboratory & diagnostic results
Class Vigil.BS.ORUIn Extends Ens.BusinessService
{

Method OnProcessInput(pInput As %Stream.Object, Output pOutput As %RegisteredObject) As %Status
{
    Set sc = $$$OK
    Try {
        Set raw = ""
        If $IsObject(pInput) {
            While 'pInput.AtEnd { Set raw = raw _ pInput.Read() }
        } Else {
            Set raw = pInput
        }
        
        Set msg = ##class(EnsLib.HL7.Message).ImportFromString(raw, .sc)
        If $$$ISERR(sc) Quit
        
        Set patientId = msg.GetValueAt("PID:3.1")
        If patientId = "" Set patientId = msg.GetValueAt("PID:3")
        Set accession = msg.GetValueAt("OBR:3.1")
        If accession = "" Set accession = msg.GetValueAt("OBR:3")
        If accession = "" Set accession = "ACC-" _ $Piece($ZDateTime($Horolog,8), " ", 1) _ "-" _ patientId
        
        Set resultTime = msg.GetValueAt("OBR:7")
        If resultTime = "" Set resultTime = msg.GetValueAt("MSH:7")
        Set normTime = ##class(Vigil.BS.ADTIn).NormalizeTime(resultTime)
        
        // Loop through all OBX segments in the message
        Set obxCount = msg.GetValueAt("OBX(*)")
        If obxCount = "" Set obxCount = 1
        
        For i = 1:1:obxCount {
            Set testCode = msg.GetValueAt("OBX("_i_"):3.1")
            Set testName = msg.GetValueAt("OBX("_i_"):3.2")
            Set val = msg.GetValueAt("OBX("_i_"):5")
            Set units = msg.GetValueAt("OBX("_i_"):6")
            Set refRange = msg.GetValueAt("OBX("_i_"):7")
            Set flag = msg.GetValueAt("OBX("_i_"):8")
            
            Set obs = ##class(Vigil.Data.Observation).%New()
            Set obs.Accession = accession
            Set obs.PatientId = patientId
            Set obs.TestCode = testCode
            Set obs.TestName = testName
            Set obs.StringValue = val
            If $IsValidNum(val) Set obs.NumericValue = +val
            Set obs.Units = units
            Set obs.RefRange = refRange
            Set obs.Flag = flag
            Set obs.ResultTime = normTime
            Do obs.%Save()
        }
        
        // Create trigger message and send to VigilProcess
        Set request = ##class(Ens.StringRequest).%New()
        Set request.StringValue = accession _ "|" _ patientId
        Set sc = ..SendRequestAsync("Vigil.BP.VigilProcess", request)
        
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

}
