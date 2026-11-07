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
    import json
    import sys
    from pathlib import Path
    
    # Import vector_memory
    sys.path.insert(0, "/home/irisowner/dev/python")
    from vigil.vector_memory import CaseMemoryEngine
    
    engine = CaseMemoryEngine()
    results = engine.search_similar(pQuery, top_k=pTopK)
    
    arr = iris.cls("%DynamicArray")._New()
    for r in results:
        obj = iris.cls("%DynamicObject")._New()
        obj.caseId = r["case_id"]
        obj.patientId = r["patient_id"]
        obj.title = r["title"]
        obj.similarity = r["similarity"]
        obj.outcome = r["outcome"]
        arr._Push(obj)
    return arr
}

}
