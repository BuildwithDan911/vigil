/// Vigil.Msg.AgentRequest - Request message for AI Hub agent decision
Class Vigil.Msg.AgentRequest Extends Ens.Request
{

Property PromptVersion As %String(MAXLEN = 64) [ InitialExpression = "loop-decision-v1" ];

Property LoopType As %String(MAXLEN = 32); // results_after_discharge, referral_leakage

Property PatientId As %String(MAXLEN = 64);

Property AccessionOrReferralId As %String(MAXLEN = 64);

Property PayloadJson As %String(MAXLEN = 4000);

Property Mode As %String(MAXLEN = 20) [ InitialExpression = "replay" ];

Storage Default
{
<Data name="AgentRequestDefaultData">
<Subscript>"AgentRequest"</Subscript>
<Value name="1">
<Value>PromptVersion</Value>
</Value>
<Value name="2">
<Value>LoopType</Value>
</Value>
<Value name="3">
<Value>PatientId</Value>
</Value>
<Value name="4">
<Value>AccessionOrReferralId</Value>
</Value>
<Value name="5">
<Value>PayloadJson</Value>
</Value>
<Value name="6">
<Value>Mode</Value>
</Value>
</Data>
<DefaultData>AgentRequestDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
