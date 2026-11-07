/// Vigil.Data.LedgerEvent - Cryptographic Append-Only Audit Event
Class Vigil.Data.LedgerEvent Extends (%Persistent, %JSON.Adaptor)
{

Property Seq As %Integer [ Required ];

Index IdxSeq On Seq [ Unique ];

Property Ts As %TimeStamp [ Required ];

Property LoopId As %String;

Property EventType As %String [ Required ];

Property Actor As %String [ Required ];

Property RuleVersion As %String [ InitialExpression = "1.0.0" ];

Property PayloadJSON As %String(MAXLEN = "") [ Required ];

Property PrevHash As %String(MAXLEN = 64) [ Required ];

Property Hash As %String(MAXLEN = 64) [ Required ];

}
