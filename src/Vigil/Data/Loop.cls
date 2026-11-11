/// Vigil.Data.Loop - Unified Loop object for results-after-discharge and referral-leakage
Class Vigil.Data.Loop Extends (%Persistent, %JSON.Adaptor)
{

Property LoopId As %String(MAXLEN = 64) [ Required ];

Property Type As %String(MAXLEN = 32) [ Required ]; // results_after_discharge, referral_leakage

Property PatientId As %String(MAXLEN = 64) [ Required ];

Property AccessionOrReferralId As %String(MAXLEN = 64);

Property Urgency As %String(MAXLEN = 20) [ Required ]; // critical, urgent, routine, no_action

Property FloorLevel As %String(MAXLEN = 20);

Property State As %String(MAXLEN = 20) [ InitialExpression = "Opened" ]; // Opened, Owned, Acted, Closed, Escalated

Property Owner As %String(MAXLEN = 64);

Property Score As %Integer [ InitialExpression = 0 ];

Property Reason As %String(MAXLEN = 500);

Property AgentReason As %String(MAXLEN = 1000);

Property DecisionSource As %String(MAXLEN = 32) [ InitialExpression = "rules" ]; // rules, agent, rules_floor, rules_fallback

Property DaysSinceDischarge As %Integer;

Property Deadline As %TimeStamp;

Property ConsentStatus As %String(MAXLEN = 20) [ InitialExpression = "send" ]; // send, redact, hold

Property CallScript As %String(MAXLEN = 2000);

Property SmsDraft As %String(MAXLEN = 500);

Property EscalationCount As %Integer [ InitialExpression = 0 ];

Property RuleVersion As %String(MAXLEN = 16) [ InitialExpression = "1.0.0" ];

Property CreatedAt As %TimeStamp;

Property PatientName As %String(MAXLEN = 128);

Property Ward As %String(MAXLEN = 64);

Property TestName As %String(MAXLEN = 128);

Property TestValue As %String(MAXLEN = 128);

Property ReferenceRange As %String(MAXLEN = 64);

Property SlaRemaining As %String(MAXLEN = 32);

Property SlaSeconds As %Integer [ InitialExpression = 7200 ];

Index IdxLoopId On LoopId [ Unique ];

Index IdxPatientId On PatientId;

Index IdxState On State;

Index IdxUrgency On Urgency;

Index IdxDedupe On (Type, PatientId, AccessionOrReferralId) [ Unique ];

Storage Default
{
<Data name="LoopDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>LoopId</Value>
</Value>
<Value name="3">
<Value>Type</Value>
</Value>
<Value name="4">
<Value>PatientId</Value>
</Value>
<Value name="5">
<Value>AccessionOrReferralId</Value>
</Value>
<Value name="6">
<Value>Urgency</Value>
</Value>
<Value name="7">
<Value>FloorLevel</Value>
</Value>
<Value name="8">
<Value>State</Value>
</Value>
<Value name="9">
<Value>Owner</Value>
</Value>
<Value name="10">
<Value>Score</Value>
</Value>
<Value name="11">
<Value>Reason</Value>
</Value>
<Value name="12">
<Value>AgentReason</Value>
</Value>
<Value name="13">
<Value>DecisionSource</Value>
</Value>
<Value name="14">
<Value>DaysSinceDischarge</Value>
</Value>
<Value name="15">
<Value>Deadline</Value>
</Value>
<Value name="16">
<Value>ConsentStatus</Value>
</Value>
<Value name="17">
<Value>CallScript</Value>
</Value>
<Value name="18">
<Value>SmsDraft</Value>
</Value>
<Value name="19">
<Value>EscalationCount</Value>
</Value>
<Value name="20">
<Value>RuleVersion</Value>
</Value>
<Value name="21">
<Value>CreatedAt</Value>
</Value>
<Value name="22">
<Value>PatientName</Value>
</Value>
<Value name="23">
<Value>Ward</Value>
</Value>
<Value name="24">
<Value>TestName</Value>
</Value>
<Value name="25">
<Value>TestValue</Value>
</Value>
<Value name="26">
<Value>ReferenceRange</Value>
</Value>
<Value name="27">
<Value>SlaRemaining</Value>
</Value>
<Value name="28">
<Value>SlaSeconds</Value>
</Value>
</Data>
<DataLocation>^Vigil.Data.LoopD</DataLocation>
<DefaultData>LoopDefaultData</DefaultData>
<IdLocation>^Vigil.Data.LoopD</IdLocation>
<IndexLocation>^Vigil.Data.LoopI</IndexLocation>
<StreamLocation>^Vigil.Data.LoopS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
