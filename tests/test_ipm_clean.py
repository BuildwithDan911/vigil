"""
test_ipm_clean.py - Phase 14 IPM Package Descriptor & Clean Install Verification
"""
import xml.etree.ElementTree as ET
from pathlib import Path

def test_ipm_descriptor():
    root_dir = Path(__file__).resolve().parent.parent
    module_xml = root_dir / "module.xml"
    assert module_xml.exists(), "Missing module.xml"
    
    tree = ET.parse(module_xml)
    root = tree.getroot()
    
    module = root.find(".//Module")
    assert module is not None, "Missing <Module> element in module.xml"
    
    name = module.find("Name")
    assert name is not None and name.text == "vigil", f"Expected module name 'vigil', got {name.text if name else None}"
    
    req = module.find("SystemRequirements")
    assert req is not None, "Missing <SystemRequirements> in module.xml"
    assert req.attrib.get("Interoperability") == "enabled"
    
    demo_doc = root_dir / "docs" / "ONLINE_DEMO.md"
    assert demo_doc.exists(), "Missing docs/ONLINE_DEMO.md"
    demo_content = demo_doc.read_text(encoding="utf-8")
    assert "irishealth-community" in demo_content
    assert "docker" in demo_content
    assert "52773" in demo_content
    
    print("[PASS] Phase 14 IPM descriptor and Online Demo Guide verified.")

if __name__ == "__main__":
    test_ipm_descriptor()
