/// Vigil.Production - Core Interoperability Production for Vigil Handoff Engine
Class Vigil.Production Extends Ens.Production
{

XData ProductionDefinition
{
<Production Name="Vigil.Production" TestingEnabled="true" LogGeneralTraceEvents="true">
  <Description>Vigil Patient-Safety Handoff Engine</Description>
  <ActorPoolSize>2</ActorPoolSize>
  <Item Name="Vigil.BS.ADTIn" Category="" ClassName="Vigil.BS.ADTIn" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
  <Item Name="Vigil.BS.ORUIn" Category="" ClassName="Vigil.BS.ORUIn" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
  <Item Name="Vigil.BS.ReferralIn" Category="" ClassName="Vigil.BS.ReferralIn" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
  <Item Name="Vigil.BS.NightShift" Category="" ClassName="Vigil.BS.NightShift" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
  <Item Name="Vigil.BP.VigilProcess" Category="" ClassName="Vigil.BP.VigilProcess" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
  <Item Name="Vigil.BO.Decide" Category="" ClassName="Vigil.BO.Decide" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
  <Item Name="VigilApprovers" Category="" ClassName="EnsLib.Workflow.Operation" PoolSize="1" Enabled="true" Foreground="false" Comment="" LogTraceEvents="true" Schedule="">
  </Item>
</Production>
}

}
