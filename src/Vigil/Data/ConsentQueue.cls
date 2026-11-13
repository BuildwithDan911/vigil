/// Vigil.Data.ConsentQueue - Review items for the Privacy & Consent tab
Class Vigil.Data.ConsentQueue Extends (%Persistent, %JSON.Adaptor)
{

Property PatientId As %String(MAXLEN = 64) [ Required ];

Index IdxPatientId On PatientId [ Unique ];

Property LoopId As %String(MAXLEN = 64);

Index IdxLoopId On LoopId [ Unique ];

Property PatientName As %String(MAXLEN = 128);

Property TestName As %String(MAXLEN = 128);

Property Rule As %String(MAXLEN = 20); // redact, hold

Property OutboundMessage As %String(MAXLEN = 500);

Property Status As %String(MAXLEN = 20) [ InitialExpression = "pending" ];

}
