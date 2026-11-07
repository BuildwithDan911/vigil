/// Vigil.Setup - IPM Installation and Production Setup Hook
Class Vigil.Setup Extends %RegisteredObject
{

ClassMethod Run() As %Status
{
    Set sc = $$$OK
    Write !, "==> Initializing Vigil for IRIS for Health configuration..."
    
    Try {
        // 1. Ensure interoperability credentials and roles
        Do ##class(Security.Users).UnExpireUserPasswords("*")
        
        // 2. Configure CSP REST Web Application /vigil
        Set namespace = $Namespace
        New $Namespace
        Set $Namespace = "%SYS"
        
        Set appPath = "/vigil"
        If '##class(Security.Applications).Exists(appPath) {
            Set props("Authe") = 32 // Unauthenticated for demo convenience
            Set props("NameSpace") = namespace
            Set props("DispatchClass") = "Vigil.Web.Dispatcher"
            Set props("IsNameSpaceDefault") = 0
            Set sc = ##class(Security.Applications).Create(appPath, .props)
            Write !, "  -> Created REST Web Application: ", appPath
        }
        
        // 3. Compile Production
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
