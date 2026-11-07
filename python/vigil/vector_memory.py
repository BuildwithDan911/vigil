"""
vector_memory.py - Vector Case Memory and Clinical Similarity Search
(c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
"""
import math
import re
from typing import List, Dict, Any, Tuple

DIMENSIONS = 128

def hash_embed(text: str, dim: int = DIMENSIONS) -> List[float]:
    """
    Deterministic offline embedding vector using token hashing and term frequency.
    Ensures zero external network dependencies and 100% reproducibility.
    """
    tokens = re.findall(r'\b[a-zA-Z0-9_\-]+\b', text.lower())
    vec = [0.0] * dim
    if not tokens:
        return vec
        
    for token in tokens:
        # 32-bit hash folding
        h = 0
        for char in token:
            h = (h * 31 + ord(char)) & 0xFFFFFFFF
        idx = h % dim
        # Directional sign from high bit
        sign = 1.0 if (h & 0x80000000) == 0 else -1.0
        vec[idx] += sign

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

# Seeded prior cases for clinical recall
SEEDED_CASES = [
    {
        "case_id": "CASE-2026-P01",
        "patient_id": "P01",
        "title": "Severe Hyperkalemia (K+ 6.8) After Discharge",
        "description": "Patient Martha Reeve discharged on ACE inhibitor. Serum potassium 6.8 mmol/L critical post-discharge handoff requiring urgent clinician recall.",
        "urgency": "critical",
        "outcome": "Contacted within 22 minutes. Dose withheld, repeat lab ordered."
    },
    {
        "case_id": "CASE-2026-P02",
        "patient_id": "P02",
        "title": "Post-Discharge Myocardial Injury (Troponin I 2.4)",
        "description": "Patient Samuel Okai high sensitivity troponin I 2.4 ng/mL day of discharge. Emergency cardiac evaluation initiated.",
        "urgency": "critical",
        "outcome": "Transferred to coronary care unit."
    },
    {
        "case_id": "CASE-2026-P15",
        "patient_id": "P15",
        "title": "Elevated INR (5.2) On Warfarin Therapy",
        "description": "Patient Fatu Conteh prothrombin time INR 5.2 two days after surgical discharge. High risk of major hemorrhage.",
        "urgency": "critical",
        "outcome": "Warfarin held, oral Vitamin K prescribed."
    },
    {
        "case_id": "CASE-2026-R01",
        "patient_id": "R01",
        "title": "Outbound Oncology Referral Leakage",
        "description": "Patient Amina Diallo outbound oncology referral unbooked for 55 hours exceeding the 48-hour SLA.",
        "urgency": "urgent",
        "outcome": "Navigator chased specialist clinic; appointment secured."
    }
]

class CaseMemoryEngine:
    def __init__(self):
        self.cases = []
        for c in SEEDED_CASES:
            vector = hash_embed(f"{c['title']} {c['description']}")
            self.cases.append({**c, "vector": vector})

    def search_similar(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        q_vec = hash_embed(query)
        scored = []
        for c in self.cases:
            score = cosine_similarity(q_vec, c["vector"])
            scored.append((score, c))
            
        scored.sort(key=lambda x: x[0], reverse=True)
        return [{**c, "similarity": round(score, 4)} for score, c in scored[:top_k]]

if __name__ == "__main__":
    engine = CaseMemoryEngine()
    results = engine.search_similar("high potassium after discharge", top_k=2)
    print("Search query: 'high potassium after discharge'")
    for r in results:
        print(f"Match: {r['patient_id']} - {r['title']} (similarity: {r['similarity']})")
    assert any(r["patient_id"] in ["P01", "P15"] for r in results), "Failed to match P01 or P15 for potassium query"
    print("[PASS] Vector Case Memory similarity search validated.")
