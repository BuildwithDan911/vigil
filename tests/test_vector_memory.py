"""
test_vector_memory.py - Phase 11 Vector Case Memory Verification
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "python"))

from vigil.vector_memory import CaseMemoryEngine

def test_vector_memory():
    engine = CaseMemoryEngine()
    
    # 1. Query "high potassium after discharge"
    res_k = engine.search_similar("high potassium after discharge", top_k=2)
    assert len(res_k) > 0
    top_patient = res_k[0]["patient_id"]
    assert top_patient in ["P01", "P15"], f"Expected P01 or P15 top match, got {top_patient}"
    assert res_k[0]["similarity"] > 0.2
    
    # 2. Query "unbooked oncology consultation referral"
    res_onc = engine.search_similar("unbooked oncology consultation referral", top_k=1)
    assert len(res_onc) > 0
    assert res_onc[0]["patient_id"] == "R01"
    
    # 3. Query "cardiac chest pain troponin discharge"
    res_trop = engine.search_similar("cardiac chest pain troponin discharge", top_k=1)
    assert len(res_trop) > 0
    assert res_trop[0]["patient_id"] == "P02"
    
    print("[PASS] Phase 11 Vector Case Memory similarity searches verified.")

if __name__ == "__main__":
    test_vector_memory()
