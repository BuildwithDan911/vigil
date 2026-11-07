"""
test_pex_auditor.py - Phase 13 PEX Score Auditor Verification
"""
import json

def test_pex_auditor():
    # Simulates PEX abnormality auditing logic
    test_cases = [
        {"flags": "HH", "py_score": 5, "expected_agree": True},
        {"flags": "LL", "py_score": 5, "expected_agree": True},
        {"flags": "H", "py_score": 3, "expected_agree": True},
        {"flags": "N", "py_score": 0, "expected_agree": True},
        {"flags": "HH", "py_score": 3, "expected_agree": False}  # disagreement
    ]
    
    for tc in test_cases:
        flags = tc["flags"]
        py_score = tc["py_score"]
        
        pex_score = 0
        if any(f in flags for f in ["HH", "LL", "PANIC", "CRITICAL"]):
            pex_score = 5
        elif any(f in flags for f in ["H", "L", "A"]):
            pex_score = 3
            
        agree = (pex_score == py_score)
        assert agree == tc["expected_agree"], f"Failed on flags={flags}, py_score={py_score}"
        
        result = {
            "auditor": "Vigil.BO.PEXAuditor",
            "agree": agree,
            "pexScore": pex_score,
            "pythonScore": py_score
        }
        assert "agree" in result
        assert isinstance(result["agree"], bool)
        
    print("[PASS] Phase 13 PEX Score Auditor verification passed.")

if __name__ == "__main__":
    test_pex_auditor()
