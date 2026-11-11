/// Vigil.Data.CaseMemory - Vector Case Memory Persistence Class
Class Vigil.Data.CaseMemory Extends (%Persistent, %JSON.Adaptor)
{

Property CaseId As %String [ Required ];

Index IdxCaseId On CaseId [ Unique ];

Property PatientId As %String;

Property Title As %String(MAXLEN = 250);

Property Description As %String(MAXLEN = 1000);

Property Urgency As %String;

Property Outcome As %String(MAXLEN = 500);

Property EmbeddingVector As %String(MAXLEN = 4096);

ClassMethod GetSimilarCases(pQuery As %String, pTopK As %Integer = 2) As %DynamicArray [ Language = python ]
{
    import iris
    import os
    import sys
    
    # Support Docker dev mount, Open Exchange /irisdev/app, and DEV_HOME
    for p in [os.environ.get("DEV_HOME", ""), "/home/irisowner/dev", "/irisdev/app"]:
        py_dir = os.path.join(p, "python") if p else ""
        if py_dir and os.path.isdir(py_dir) and py_dir not in sys.path:
            sys.path.insert(0, py_dir)
    from vigil.vector_memory import CaseMemoryEngine
    
    engine = CaseMemoryEngine()
    results = engine.search_similar(pQuery, top_k=pTopK)
    
    arr = iris.cls("%DynamicArray")._New()
    for r in results:
        obj = iris.cls("%DynamicObject")._New()
        obj._Set("caseId", r["case_id"])
        obj._Set("patientId", r["patient_id"])
        obj._Set("title", r["title"])
        obj._Set("similarity", r["similarity"])
        obj._Set("outcome", r["outcome"])
        arr._Push(obj)
    return arr
}

}
