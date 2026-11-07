/// Vigil.Data.Encounter - Inpatient encounter tracking admission and discharge timestamps
Class Vigil.Data.Encounter Extends (%Persistent, %JSON.Adaptor)
{

Property EncounterId As %String(MAXLEN = 64) [ Required ];

Property PatientId As %String(MAXLEN = 64) [ Required ];

Property AdmitTime As %TimeStamp;

Property DischargeTime As %TimeStamp;

Property Ward As %String(MAXLEN = 32);

Property Status As %String(MAXLEN = 20) [ InitialExpression = "admitted" ]; // admitted, discharged

Index IdxEncounterId On EncounterId [ Unique ];

Index IdxPatientId On PatientId;

Storage Default
{
<Data name="EncounterDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>EncounterId</Value>
</Value>
<Value name="3">
<Value>PatientId</Value>
</Value>
<Value name="4">
<Value>AdmitTime</Value>
</Value>
<Value name="5">
<Value>DischargeTime</Value>
</Value>
<Value name="6">
<Value>Ward</Value>
</Value>
<Value name="7">
<Value>Status</Value>
</Value>
</Data>
<DataLocation>^Vigil.Data.EncounterD</DataLocation>
<DefaultData>EncounterDefaultData</DefaultData>
<IdLocation>^Vigil.Data.EncounterD</IdLocation>
<IndexLocation>^Vigil.Data.EncounterI</IndexLocation>
<StreamLocation>^Vigil.Data.EncounterS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
