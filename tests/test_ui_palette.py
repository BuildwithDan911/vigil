"""
test_ui_palette.py - Validate UI Design System, Tokens, and Zero-WHO Compliance
"""
import re
from pathlib import Path

def test_ui():
    web_dir = Path(__file__).resolve().parent.parent / "web"
    html = (web_dir / "index.html").read_text(encoding="utf-8")
    css = (web_dir / "styles.css").read_text(encoding="utf-8")
    js = (web_dir / "app.js").read_text(encoding="utf-8")
    
    # 1. Zero mentions of WHO or World Health across all frontend assets
    for filename, text in [("index.html", html), ("styles.css", css), ("app.js", js)]:
        assert not re.search(r"\bWHO\b|World Health", text, re.IGNORECASE), f"Found forbidden WHO reference in web/{filename}"

    # 2. Modern Clinical Design Tokens
    assert "#F8FAFC" in css or "#f8fafc" in css or "#F4F1EA" in css, "Missing background canvas token"
    assert "#0F172A" in css or "#0f172a" in css or "#15233B" in css, "Missing primary text ink token"
    
    # 3. Typography
    assert any(f in html for f in ["Inter", "IBM Plex", "IBM+Plex", "sans-serif"]), "Missing primary typography"
    assert any(f in css for f in ["Inter", "IBM Plex", "sans-serif"]), "Missing typography in styles.css"
    
    # 4. Lanes present
    assert 'id="cardsOpened"' in html
    assert 'id="cardsOwned"' in html
    assert 'id="cardsEscalated"' in html
    assert 'id="cardsActed"' in html
    
    # 5. Safety Stress Test button & modal present
    assert "Safety" in html or "Adversarial" in html
    assert "adversarialModal" in html
    
    # 6. Mode chip
    assert 'id="modeChip"' in html
    
    # 7. JavaScript key functions
    assert "function renderBoard" in js
    assert "function openCardDetail" in js
    assert "function updateScriptLanguage" in js
    assert "function verifyLedger" in js
    assert "function simulateTamper" in js
    
    print("[PASS] Modern Clinical UI, Design Tokens, and Zero-WHO Compliance Verified.")

if __name__ == "__main__":
    test_ui()
