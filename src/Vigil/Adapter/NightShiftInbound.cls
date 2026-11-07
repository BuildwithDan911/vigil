/// Vigil.Adapter.NightShiftInbound - Custom Inbound Adapter simulating 24h hospital clock in 90 seconds
Class Vigil.Adapter.NightShiftInbound Extends Ens.InboundAdapter
{

Property ReplaySpeedMultiplier As %Integer [ InitialExpression = 1 ];

Property IsPlaying As %Boolean [ InitialExpression = 0 ];

Property CurrentHospitalTime As %TimeStamp;

Method OnTask() As %Status
{
    Set sc = $$$OK
    If '..IsPlaying Quit $$$OK
    
    // Process input event batch through business host
    Set sc = ..BusinessHost.ProcessInput(..CurrentHospitalTime)
    Quit sc
}

}
