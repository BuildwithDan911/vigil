/// Vigil.BO.Decide - Interoperability Business Operation executing AI Hub Agent decisions & DPI-I-689 telemetry
Class Vigil.BO.Decide Extends Ens.BusinessOperation
{

Parameter INVOCATION = "Queue";

Method OnMessage(pRequest As Vigil.Msg.AgentRequest, Output pResponse As Vigil.Msg.AgentDecision) As %Status
{
    Set sc = $$$OK
    Set pResponse = ##class(Vigil.Msg.AgentDecision).%New()
    
    Try {
        Set rawDecisionJson = ..ExecuteDecision(pRequest.PayloadJson, pRequest.Mode)
        Set d = {}.%FromJSON(rawDecisionJson)
        
        Set pResponse.PromptVersion = d.prompt_version
        Set pResponse.Model = d.model
        Set pResponse.TokenInput = d.token_input
        Set pResponse.TokenOutput = d.token_output
        Set pResponse.LatencyMs = d.latency_ms
        Set pResponse.ToolNames = d.tool_names
        Set pResponse.FallbackReason = d.fallback_reason
        Set pResponse.Mode = d.mode
        Set pResponse.ContentPreview = d.content_preview
        
        Set dec = d.decision
        Set pResponse.Urgency = dec.urgency
        Set pResponse.Owner = dec.owner
        Set pResponse.Reason = dec.reason
        Set pResponse.CallScript = dec.call_script
        Set pResponse.SmsDraft = dec.sms_draft
        Set pResponse.ConsentRecommendation = dec.consent_recommendation
        If dec.%IsDefined("referral_action") Set pResponse.ReferralAction = dec.referral_action
        Set pResponse.Confidence = dec.confidence
        
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
    sys.path.append("/home/irisowner/dev/python")
    from vigil.agent_adapter import decide

    payload = json.loads(payloadJson) if payloadJson else {}
    api_key = os.environ.get("GEMINI_API_KEY", "")
    replay_dir = "/home/irisowner/dev/data/replay/decisions"

    res = decide(payload=payload, mode=mode, api_key=api_key, replay_dir=replay_dir)
    return json.dumps(res)
}

}
