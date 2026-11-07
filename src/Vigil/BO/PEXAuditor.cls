/// Vigil.BO.PEXAuditor - InterSystems PEX Score Auditor Business Operation
Class Vigil.BO.PEXAuditor Extends Ens.BusinessOperation
{

Parameter INVOCATION = "Queue";

Method OnMessage(pRequest As Ens.StringRequest, Output pResponse As Ens.StringResponse) As %Status
{
    Set sc = $$$OK
    Set pResponse = ##class(Ens.StringResponse).%New()
    
    Try {
        // Evaluate flags independently via PEX logic
        // pRequest.StringValue format: "FLAGS|PYTHON_SCORE"
        Set input = pRequest.StringValue
        Set flags = $Piece(input, "|", 1)
        Set pyScore = +$Piece(input, "|", 2)
        
        Set pexScore = 0
        If (flags [ "HH") || (flags [ "LL") || (flags [ "PANIC") {
            Set pexScore = 5
        } ElseIf (flags [ "H") || (flags [ "L") || (flags [ "A") {
            Set pexScore = 3
        }
        
        Set agree = (pexScore = pyScore)
        Set result = {
            "auditor": "Vigil.BO.PEXAuditor",
            "agree": (agree),
            "pexScore": (pexScore),
            "pythonScore": (pyScore),
            "flagsChecked": (flags)
        }
        
        Set pResponse.StringValue = result.%ToJSON()
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    
    Quit sc
}

}
