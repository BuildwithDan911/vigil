/// Vigil.Data.Patient - Clinical patient demographic and consent record
Class Vigil.Data.Patient Extends (%Persistent, %JSON.Adaptor)
{

Property PatientId As %String(MAXLEN = 64) [ Required ];

Property FamilyName As %String(MAXLEN = 100);

Property GivenName As %String(MAXLEN = 100);

Property DOB As %Date;

Property Sex As %String(MAXLEN = 10);

Property LivesAlone As %Boolean [ InitialExpression = 0 ];

Property CurrentWard As %String(MAXLEN = 32);

Property PreferredLanguage As %String(MAXLEN = 10) [ InitialExpression = "en" ];

Property ShareResultsSms As %Boolean [ InitialExpression = 1 ];

Property ShareSensitive As %Boolean [ InitialExpression = 1 ];

Index IdxPatientId On PatientId [ Unique ];

Storage Default
{
<Data name="PatientDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>PatientId</Value>
</Value>
<Value name="3">
<Value>FamilyName</Value>
</Value>
<Value name="4">
<Value>GivenName</Value>
</Value>
<Value name="5">
<Value>DOB</Value>
</Value>
<Value name="6">
<Value>Sex</Value>
</Value>
<Value name="7">
<Value>LivesAlone</Value>
</Value>
<Value name="8">
<Value>CurrentWard</Value>
</Value>
<Value name="9">
<Value>PreferredLanguage</Value>
</Value>
<Value name="10">
<Value>ShareResultsSms</Value>
</Value>
<Value name="11">
<Value>ShareSensitive</Value>
</Value>
</Data>
<DataLocation>^Vigil.Data.PatientD</DataLocation>
<DefaultData>PatientDefaultData</DefaultData>
<IdLocation>^Vigil.Data.PatientD</IdLocation>
<IndexLocation>^Vigil.Data.PatientI</IndexLocation>
<StreamLocation>^Vigil.Data.PatientS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
