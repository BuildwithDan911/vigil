/// Vigil.Setup - IPM Installation and Production Setup Hook
Class Vigil.Setup Extends %RegisteredObject
{

ClassMethod Run() As %Status
{
    Set sc = $$$OK
    Write !, "==> Initializing Vigil for IRIS for Health configuration..."
    
    Try {
        // 1. Configure CSP REST Web Application /vigil
        Set namespace = $Namespace
        New $Namespace
        Set $Namespace = "%SYS"
        
        Do ##class(Security.Users).UnExpireUserPasswords("*")
        
        Set appPath = "/vigil"
        Set props("AutheEnabled") = 96 // 32 (Unauthenticated) + 64 (Password)
        Set props("MatchRoles") = ":%All"
        Set props("NameSpace") = namespace
        Set props("DispatchClass") = "Vigil.Web.Dispatcher"
        Set props("IsNameSpaceDefault") = 0
        If '##class(Security.Applications).Exists(appPath) {
            Set sc = ##class(Security.Applications).Create(appPath, .props)
            Write !, "  -> Created REST Web Application: ", appPath
        } Else {
            Set sc = ##class(Security.Applications).Modify(appPath, .props)
            Write !, "  -> Updated REST Web Application: ", appPath
        }
        
        // 2. Compile Production
        Set $Namespace = namespace
        Do $System.OBJ.Compile("Vigil.Production", "ck")
        Write !, "  -> Vigil production compiled successfully."
        
    } Catch ex {
        Set sc = ex.AsStatus()
        Write !, "  [ERROR] Setup encountered: ", $System.Status.GetErrorText(sc)
    }
    
    Write !, "==> Vigil Setup Completed: ", $Select($$$ISOK(sc):"OK", 1:"FAILED"), !
    Quit sc
}

}
