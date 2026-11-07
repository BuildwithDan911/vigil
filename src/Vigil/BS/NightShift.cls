/// Vigil.BS.NightShift - Business service driving 24-hour Night Shift replay via custom inbound adapter
Class Vigil.BS.NightShift Extends Ens.BusinessService
{

Parameter ADAPTER = "Vigil.Adapter.NightShiftInbound";

Method OnProcessInput(pInput As %String, Output pOutput As %RegisteredObject) As %Status
{
    Set sc = $$$OK
    Try {
        // Trigger simulated clock step across all open loops
        Set request = ##class(Ens.StringRequest).%New()
        Set request.StringValue = "CLOCK_TICK|" _ pInput
        Set sc = ..SendRequestAsync("Vigil.BP.VigilProcess", request)
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

}
