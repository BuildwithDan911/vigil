/// Vigil.BS.NightShift - Business service driving 24-hour Night Shift replay via custom inbound adapter
Class Vigil.BS.NightShift Extends Ens.BusinessService
{

Parameter ADAPTER = "Vigil.Adapter.NightShiftInbound";

Method OnProcessInput(pInput As %RegisteredObject, Output pOutput As %RegisteredObject, ByRef pHint As %String) As %Status
{
    Set sc = $$$OK
    Try {
        // Trigger simulated clock step across all open loops
        Set request = ##class(Ens.StringRequest).%New()
        Set tickVal = ""
        If $IsObject(pInput) {
            If pInput.%IsA("Ens.StringContainer") || pInput.%IsA("Ens.StringRequest") {
                Set tickVal = pInput.StringValue
            } Else {
                Set tickVal = pInput.%ToString()
            }
        } Else {
            Set tickVal = pInput
        }
        Set request.StringValue = "CLOCK_TICK|" _ tickVal
        Set sc = ..SendRequestAsync("Vigil.BP.VigilProcess", request)
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

}
