/// Vigil.Data.Consent - Patient Consent and Sensitivity Policy
Class Vigil.Data.Consent Extends (%Persistent, %JSON.Adaptor)
{

Property PatientId As %String [ Required ];

Index IdxPatientId On PatientId [ Unique ];

Property ShareResultsSMS As %Boolean [ InitialExpression = 1 ];

Property ShareSensitive As %Boolean [ InitialExpression = 1 ];

Property PreferredLanguage As %String [ InitialExpression = "en" ];

Property UpdatedAt As %TimeStamp [ InitialExpression = {$ZDateTime($Horolog, 3)} ];

ClassMethod GetPolicy(pPatientId As %String, Output pShareSMS As %Boolean, Output pShareSensitive As %Boolean, Output pLang As %String) As %Status
{
    Set consent = ..IdxPatientIdOpen(pPatientId)
    If $IsObject(consent) {
        Set pShareSMS = consent.ShareResultsSMS
        Set pShareSensitive = consent.ShareSensitive
        Set pLang = consent.PreferredLanguage
    } Else {
        // Defaults
        Set pShareSMS = 1
        Set pShareSensitive = 1
        Set pLang = "en"
    }
    Quit $$$OK
}

}
