/// Vigil.BS.ReferralIn - Inbound service for outbound referral events and booking updates
Class Vigil.BS.ReferralIn Extends Ens.BusinessService
{

Method OnProcessInput(pInput As %RegisteredObject, Output pOutput As %RegisteredObject, ByRef pHint As %String) As %Status
{
    Set sc = $$$OK
    Try {
        Set raw = ""
        If $IsObject(pInput) {
            While 'pInput.AtEnd { Set raw = raw _ pInput.Read() }
        } Else {
            Set raw = pInput
        }
        
        Set json = {}.%FromJSON(raw)
        Set refId = json.%Get("referralId")
        Set patientId = json.%Get("patientId")
        
        // Pass referral JSON directly to VigilProcess
        Set request = ##class(Ens.StringRequest).%New()
        Set request.StringValue = "REFERRAL|" _ patientId _ "|" _ raw
        Set sc = ..SendRequestAsync("Vigil.BP.VigilProcess", request)
        
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

}
