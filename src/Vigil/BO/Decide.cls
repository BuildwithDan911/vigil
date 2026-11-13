/// Vigil.BO.Decide - Interoperability Business Operation executing AI Hub Agent decisions & DPI-I-689 telemetry
Class Vigil.BO.Decide Extends Ens.BusinessOperation
{

Parameter INVOCATION = "Queue";

Method Decide(pRequest As Vigil.Msg.AgentRequest, Output pResponse As Vigil.Msg.AgentDecision) As %Status
{
    Set sc = $$$OK
    Set pResponse = ##class(Vigil.Msg.AgentDecision).%New()
    
    Try {
        Set rawDecisionJson = ..ExecuteDecision(pRequest.PayloadJson, pRequest.Mode)
        Set d = {}.%FromJSON(rawDecisionJson)
        
        Set pResponse.PromptVersion = d.%Get("prompt_version")
        Set pResponse.Model = d.%Get("model")
        Set pResponse.TokenInput = d.%Get("token_input")
        Set pResponse.TokenOutput = d.%Get("token_output")
        Set pResponse.LatencyMs = d.%Get("latency_ms")
        Set pResponse.ToolNames = d.%Get("tool_names")
        Set pResponse.FallbackReason = d.%Get("fallback_reason")
        Set pResponse.Mode = d.%Get("mode")
        Set pResponse.ContentPreview = d.%Get("content_preview")
        
        Set dec = d.%Get("decision")
        If $IsObject(dec) {
            Set pResponse.Urgency = dec.%Get("urgency")
            Set pResponse.Owner = dec.%Get("owner")
            Set pResponse.Reason = dec.%Get("reason")
            Set pResponse.CallScript = dec.%Get("call_script")
            Set pResponse.SmsDraft = dec.%Get("sms_draft")
            Set pResponse.ConsentRecommendation = dec.%Get("consent_recommendation")
            If dec.%IsDefined("referral_action") Set pResponse.ReferralAction = dec.%Get("referral_action")
            Set pResponse.Confidence = dec.%Get("confidence")
        }
        
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

ClassMethod ExecuteDecision(payloadJson As %String, mode As %String) As %String [ Language = python ]
{
    import json
    import os
    import sys

    replay_dir = "/home/irisowner/dev/data/replay/decisions"
    for p in [os.environ.get("DEV_HOME", ""), "/home/irisowner/dev", "/irisdev/app"]:
        if p:
            py_dir = os.path.join(p, "python")
            if os.path.isdir(py_dir) and py_dir not in sys.path:
                sys.path.insert(0, py_dir)
            r_dir = os.path.join(p, "data", "replay", "decisions")
            if os.path.isdir(r_dir):
                replay_dir = r_dir
    from vigil.agent_adapter import decide

    payload = json.loads(payloadJson) if payloadJson else {}
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not mode:
        mode = os.environ.get("VIGIL_MODE", "replay")

    res = decide(payload=payload, mode=mode, api_key=api_key, replay_dir=replay_dir)
    return json.dumps(res)
}

XData MessageMap
{
<MapItems>
  <MapItem MessageType="Vigil.Msg.AgentRequest">
    <Method>Decide</Method>
  </MapItem>
</MapItems>
}

}
