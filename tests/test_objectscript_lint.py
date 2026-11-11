"""
ObjectScript Static Linter for Vigil .cls files.
Checks for common InterSystems ObjectScript compiler & runtime pitfalls:
1. DynamicObject dot-access with underscores (e.g. obj.my_field -> invalid because '_' is concatenation!)
2. Underscores inside ObjectScript identifiers (Set foo_bar = 1 -> invalid)
3. Invalid default values on ByRef or Output arguments
4. Unbalanced braces outside strings/comments/XData/Python blocks
5. Malformed XML inside XData blocks (UrlMap, MessageMap, ProductionDefinition)
"""
import os
import re
import glob
import xml.etree.ElementTree as ET


def strip_strings_and_comments(line: str) -> str:
    out = []
    in_str = False
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == '"':
            if in_str and i + 1 < len(line) and line[i + 1] == '"':
                i += 2
                continue
            in_str = not in_str
            i += 1
            continue
        if not in_str and line[i:i+2] == "//":
            break
        if not in_str:
            out.append(ch)
        i += 1
    return "".join(out)


def audit_cls_file(filepath: str):
    errors = []
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    in_python = False
    in_xdata = False
    in_storage = False
    in_sql = False
    brace_depth = 0
    block_brace_start = 0
    xdata_name = ""
    xdata_lines = []

    for idx, raw_line in enumerate(lines, start=1):
        stripped = raw_line.strip()

        # Track Python methods
        if not in_python and ("[ Language = python ]" in raw_line or "[Language = python]" in raw_line):
            in_python = True
            block_brace_start = brace_depth
            continue

        # Track XData / Storage
        if re.match(r"^(XData|Storage)\s+", stripped):
            in_xdata = True
            in_storage = stripped.startswith("Storage")
            xdata_name = stripped.split()[1] if len(stripped.split()) > 1 else ""
            xdata_lines = []
            block_brace_start = brace_depth
            if "{" in stripped:
                brace_depth += stripped.count("{") - stripped.count("}")
            continue

        if in_python or in_xdata:
            if in_python:
                if raw_line.rstrip() == "}":
                    in_python = False
                continue
            else:
                brace_depth += stripped.count("{") - stripped.count("}")
                if brace_depth <= block_brace_start and "}" in stripped:
                    if not in_storage and xdata_lines:
                        xml_body = "\n".join(xdata_lines).strip()
                        if xml_body.startswith("<"):
                            try:
                                # Wrap if multiple root elements (not standard) or parse directly
                                ET.fromstring(xml_body)
                            except ET.ParseError as e:
                                errors.append(f"{filepath}:{idx}: Malformed XML in XData {xdata_name}: {e}")
                    in_xdata = False
                    in_storage = False
                else:
                    if not (stripped == "{" and not xdata_lines):
                        xdata_lines.append(raw_line.rstrip())
                continue

        # Embedded SQL check (&sql(...))
        if "&sql(" in stripped.lower():
            in_sql = True
        if in_sql:
            if ")" in stripped:
                in_sql = False
            continue

        code = strip_strings_and_comments(raw_line)
        brace_depth += code.count("{") - code.count("}")

        # 1. Check for dot-access with underscore: e.g. scoreObj.final_level
        dot_underscore = re.findall(r"([A-Za-z%][A-Za-z0-9]*)\.([A-Za-z0-9]*_[A-Za-z0-9_]*)", code)
        for obj, prop in dot_underscore:
            errors.append(f"{filepath}:{idx}: Invalid dot-access with underscore '{obj}.{prop}' (use {obj}.%Get(\"{prop}\"))")

        # 2. Invalid assignment to identifier with underscore
        assign_underscore = re.findall(r"\b(?:Set|For|If|ElseIf|Quit)\s+([A-Za-z%][A-Za-z0-9]*_[A-Za-z0-9_]*)\s*=", code, re.IGNORECASE)
        for var in assign_underscore:
            errors.append(f"{filepath}:{idx}: Invalid assignment to identifier with underscore '{var}'")

        # 3. Suspicious underscore tokens
        tokens = re.findall(r"(?<![\"A-Za-z0-9_$%])([A-Za-z%][A-Za-z0-9]*_[A-Za-z0-9_]+)", code)
        for tok in tokens:
            errors.append(f"{filepath}:{idx}: Suspicious underscore in ObjectScript token '{tok}' (possible accidental snake_case or unspaced concat)")

        # 4. Invalid default values on ByRef or Output arguments
        if re.search(r"\b(ByRef|Output)\s+[A-Za-z0-9%]+\s+As\s+[A-Za-z0-9%.]+\s*=", code, re.IGNORECASE):
            errors.append(f"{filepath}:{idx}: Default value not allowed on ByRef/Output parameter in ObjectScript")

    if brace_depth != 0:
        errors.append(f"{filepath}: Unbalanced braces detected (final depth={brace_depth})")

    return errors


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cls_files = sorted(glob.glob(os.path.join(base, "src", "**", "*.cls"), recursive=True))
    assert len(cls_files) > 0, "No .cls files found!"

    all_errors = []
    for path in cls_files:
        all_errors.extend(audit_cls_file(path))

    if all_errors:
        for e in all_errors:
            print("[ERROR]", e)
        raise AssertionError(f"Found {len(all_errors)} ObjectScript lint error(s)!")

    print(f"[PASS] Audited {len(cls_files)} ObjectScript .cls files: 0 syntax, brace, signature, or XData XML issues found.")


if __name__ == "__main__":
    main()
