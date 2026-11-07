/// Vigil.Data.Observation - Clinical observation/lab result row extracted from HL7 OBX segments
Class Vigil.Data.Observation Extends (%Persistent, %JSON.Adaptor)
{

Property Accession As %String(MAXLEN = 64) [ Required ];

Property PatientId As %String(MAXLEN = 64) [ Required ];

Property TestCode As %String(MAXLEN = 64);

Property TestName As %String(MAXLEN = 128);

Property NumericValue As %Numeric;

Property StringValue As %String(MAXLEN = 128);

Property Units As %String(MAXLEN = 32);

Property RefRange As %String(MAXLEN = 64);

Property Flag As %String(MAXLEN = 10); // HH, LL, AA, H, L, A, N

Property ResultTime As %TimeStamp;

Index IdxAccession On Accession;

Index IdxPatientId On PatientId;

Storage Default
{
<Data name="ObservationDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Accession</Value>
</Value>
<Value name="3">
<Value>PatientId</Value>
</Value>
<Value name="4">
<Value>TestCode</Value>
</Value>
<Value name="5">
<Value>TestName</Value>
</Value>
<Value name="6">
<Value>NumericValue</Value>
</Value>
<Value name="7">
<Value>StringValue</Value>
</Value>
<Value name="8">
<Value>Units</Value>
</Value>
<Value name="9">
<Value>RefRange</Value>
</Value>
<Value name="10">
<Value>Flag</Value>
</Value>
<Value name="11">
<Value>ResultTime</Value>
</Value>
</Data>
<DataLocation>^Vigil.Data.ObservationD</DataLocation>
<DefaultData>ObservationDefaultData</DefaultData>
<IdLocation>^Vigil.Data.ObservationD</IdLocation>
<IndexLocation>^Vigil.Data.ObservationI</IndexLocation>
<StreamLocation>^Vigil.Data.ObservationS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
