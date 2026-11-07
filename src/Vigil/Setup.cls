/// Vigil.Setup - Namespace, user accounts, and environment setup
Class Vigil.Setup Extends %RegisteredObject
{

/// Entrypoint called during container build and IPM package installation
ClassMethod Run() As %Status
{
    Set sc = $$$OK
    Write "Setting up Vigil for IRIS for Health...",!
    
    // 1. Create Workflow role VigilApprovers if not present
    Set sc = ..SetupWorkflowRoles()
    If $$$ISERR(sc) Quit sc
    
    // 2. Create demo users (dr.okonkwo, dr.mensah, dr.adewale)
    Set sc = ..SetupDemoUsers()
    If $$$ISERR(sc) Quit sc
    
    // 3. Configure web application /vigil and REST API
    Set sc = ..SetupWebApplication()
    If $$$ISERR(sc) Quit sc
    
    Write "Vigil setup completed successfully.",!
    Quit sc
}

/// Creates VigilApprovers workflow role and users
ClassMethod SetupWorkflowRoles() As %Status
{
    Set sc = $$$OK
    Try {
        // If Workflow engine is loaded, register role
        If ##class(%Dictionary.CompiledClass).%ExistsId("EnsLib.Workflow.RoleDefinition") {
            If '##class(EnsLib.Workflow.RoleDefinition).%ExistsId("VigilApprovers") {
                Set role = ##class(EnsLib.Workflow.RoleDefinition).%New()
                Set role.Name = "VigilApprovers"
                Set role.Description = "Clinical escalation and critical loop approvers"
                Set sc = role.%Save()
            }
        }
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

/// Creates demo clinicians in role VigilApprovers
ClassMethod SetupDemoUsers() As %Status
{
    Set sc = $$$OK
    Set users = $ListBuild("dr.okonkwo", "dr.mensah", "dr.adewale")
    Set ptr = 0
    While $ListNext(users, ptr, username) {
        Try {
            // Setup in %SYS if needed
            New $Namespace
            Set $Namespace = "%SYS"
            If '##class(Security.Users).%ExistsId(username) {
                Set props("Password") = "SYS"
                Set props("Roles") = "%All,VigilApprovers"
                Set props("Enabled") = 1
                Set props("ChangePassword") = 0
                Do ##class(Security.Users).Create(username, .props)
            }
            Do ##class(Security.Users).UnExpireUserPasswords(username)
        } Catch ex {
            // Log but don't fail container initialization
        }
    }
    Quit sc
}

/// Configures /vigil Web Application serving the SPA and REST endpoints
ClassMethod SetupWebApplication() As %Status
{
    Set sc = $$$OK
    Try {
        New $Namespace
        Set $Namespace = "%SYS"
        
        Set appName = "/vigil"
        If '##class(Security.Applications).%ExistsId(appName) {
            Set props("Description") = "Vigil Clinical Web Application and API"
            Set props("Path") = "/home/irisowner/dev/web/"
            Set props("AutheEnabled") = 96 // Unauthenticated + Password
            Set props("DispatchClass") = "Vigil.Web.Dispatcher"
            Set props("ServeFiles") = 1
            Set sc = ##class(Security.Applications).Create(appName, .props)
        }
    } Catch ex {
        Set sc = ex.AsStatus()
    }
    Quit sc
}

/// HealthCheck helper used by docker healthcheck and scripts
ClassMethod HealthCheck() As %Status
{
    Write "VIGIL_HEALTH_OK",!
    Quit $$$OK
}

}
