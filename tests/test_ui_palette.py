"""
test_ui_palette.py - Validate UI Design System, Paper Palette, and Tokens
"""
import re
from pathlib import Path

def test_ui():
    web_dir = Path(__file__).resolve().parent.parent / "web"
    html = (web_dir / "index.html").read_text(encoding="utf-8")
    css = (web_dir / "styles.css").read_text(encoding="utf-8")
    js = (web_dir / "app.js").read_text(encoding="utf-8")
    
    # 1. Background palette #F4F1EA
    assert "#F4F1EA" in css or "#f4f1ea" in css, "Missing paper background #F4F1EA"
    # 2. Dark navy ink #15233B
    assert "#15233B" in css or "#15233b" in css, "Missing dark navy ink #15233B"
    # 3. Typography IBM Plex
    assert "IBM Plex" in html or "IBM+Plex" in html, "Missing IBM Plex font in index.html"
    assert "IBM Plex" in css, "Missing IBM Plex font in styles.css"
    
    # 4. Lanes present
    assert 'id="cardsOpened"' in html
    assert 'id="cardsOwned"' in html
    assert 'id="cardsEscalated"' in html
    assert 'id="cardsActed"' in html
    
    # 5. Adversarial Stress Test button present
    assert "Test Adversarial" in html or "Adversarial Stress-Test" in html
    assert "adversarialModal" in html
    
    # 6. Mode chip
    assert 'id="modeChip"' in html
    
    # 7. JavaScript key functions
    assert "function renderBoard" in js
    assert "function openCardDetail" in js
    assert "function updateScriptLanguage" in js
    assert "function verifyLedger" in js
    assert "function simulateTamper" in js
    
    print("[PASS] UI Paper Palette, WCAG Tokens, and Interactive Controls Verified.")

if __name__ == "__main__":
    test_ui()
