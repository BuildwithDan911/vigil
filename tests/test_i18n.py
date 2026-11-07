"""
test_i18n.py - Phase 12 Multilingual Callback Scripts Verification
"""
import json
from pathlib import Path

LANGS = ["en", "fr", "es", "ar", "pt", "sw"]

def test_i18n():
    i18n_dir = Path(__file__).resolve().parent.parent / "data" / "i18n"
    
    for pid in ["P01", "R01"]:
        for lang in LANGS:
            path = i18n_dir / lang / f"{pid}.json"
            assert path.exists(), f"Missing {path}"
            
            data = json.loads(path.read_text(encoding="utf-8"))
            assert data["lang"] == lang
            assert "call_script" in data and len(data["call_script"]) > 10
            assert "sms_draft" in data and len(data["sms_draft"]) > 10
            assert "english_back_translation" in data and len(data["english_back_translation"]) > 10
            
            if lang == "ar":
                assert data["direction"] == "rtl"
            else:
                assert data["direction"] == "ltr"
                
    # Verify fr and ar change text while back-translation remains English
    p01_en = json.loads((i18n_dir / "en" / "P01.json").read_text(encoding="utf-8"))
    p01_fr = json.loads((i18n_dir / "fr" / "P01.json").read_text(encoding="utf-8"))
    p01_ar = json.loads((i18n_dir / "ar" / "P01.json").read_text(encoding="utf-8"))
    
    assert p01_en["call_script"] != p01_fr["call_script"]
    assert p01_en["call_script"] != p01_ar["call_script"]
    assert "Harbourview General Hospital" in p01_fr["english_back_translation"]
    assert "Harbourview General Hospital" in p01_ar["english_back_translation"]
    
    print("[PASS] Phase 12 Multilingual scripts verified for all 6 languages.")

if __name__ == "__main__":
    test_i18n()
