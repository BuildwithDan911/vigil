/// Vigil.Msg.AgentDecision - Response message containing AI Hub agent decision and DPI-I-689 tracing
Class Vigil.Msg.AgentDecision Extends Ens.Response
{

Property PromptVersion As %String(MAXLEN = 64) [ InitialExpression = "loop-decision-v1" ];

Property Model As %String(MAXLEN = 64);

Property TokenInput As %Integer [ InitialExpression = 0 ];

Property TokenOutput As %Integer [ InitialExpression = 0 ];

Property LatencyMs As %Integer [ InitialExpression = 0 ];

Property ToolNames As %String(MAXLEN = 256);

Property FallbackReason As %String(MAXLEN = 500);

Property Mode As %String(MAXLEN = 20); // live or replay

Property ContentPreview As %String(MAXLEN = 500);

Property Urgency As %String(MAXLEN = 20);

Property Owner As %String(MAXLEN = 64);

Property Reason As %String(MAXLEN = 1000);

Property CallScript As %String(MAXLEN = 2000);

Property SmsDraft As %String(MAXLEN = 500);

Property ConsentRecommendation As %String(MAXLEN = 20);

Property ReferralAction As %String(MAXLEN = 32);

Property Confidence As %Numeric [ InitialExpression = 1.0 ];

Storage Default
{
<Data name="AgentDecisionDefaultData">
<Subscript>"AgentDecision"</Subscript>
<Value name="1">
<Value>PromptVersion</Value>
</Value>
<Value name="2">
<Value>Model</Value>
</Value>
<Value name="3">
<Value>TokenInput</Value>
</Value>
<Value name="4">
<Value>TokenOutput</Value>
</Value>
<Value name="5">
<Value>LatencyMs</Value>
</Value>
<Value name="6">
<Value>ToolNames</Value>
</Value>
<Value name="7">
<Value>FallbackReason</Value>
</Value>
<Value name="8">
<Value>Mode</Value>
</Value>
<Value name="9">
<Value>ContentPreview</Value>
</Value>
<Value name="10">
<Value>Urgency</Value>
</Value>
<Value name="11">
<Value>Owner</Value>
</Value>
<Value name="12">
<Value>Reason</Value>
</Value>
<Value name="13">
<Value>CallScript</Value>
</Value>
<Value name="14">
<Value>SmsDraft</Value>
</Value>
<Value name="15">
<Value>ConsentRecommendation</Value>
</Value>
<Value name="16">
<Value>ReferralAction</Value>
</Value>
<Value name="17">
<Value>Confidence</Value>
</Value>
</Data>
<DefaultData>AgentDecisionDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
