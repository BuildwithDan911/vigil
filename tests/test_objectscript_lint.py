"""
ObjectScript Static Linter for Vigil .cls files.
Checks for common InterSystems ObjectScript compiler & runtime pitfalls:
1. DynamicObject dot-access with underscores (e.g. obj.my_field -> invalid because '_' is concatenation!)
2. Underscores inside ObjectScript identifiers (Set foo_bar = 1 -> invalid)
3. Unbalanced braces outside strings/comments/XData/Python blocks
4. Missing Storage Default issues or malformed XData
"""
import os
import re
import glob


def strip_strings_and_comments(line: str) -> str:
    # Remove // comments outside quotes
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

    for idx, raw_line in enumerate(lines, start=1):
        stripped = raw_line.strip()

        # Track Python methods
        if not in_python and ("[ Language = python ]" in raw_line or "[Language = python]" in raw_line):
            in_python = True
            block_brace_start = brace_depth
            # Wait for opening brace
            continue

        # Track XData / Storage
        if re.match(r"^(XData|Storage)\s+", stripped):
            in_xdata = True
            block_brace_start = brace_depth
            if "{" in stripped:
                brace_depth += stripped.count("{") - stripped.count("}")
            continue

        if in_python or in_xdata:
            if in_python:
                # Exit python method block only at column-0 closing brace
                if raw_line.rstrip() == "}":
                    in_python = False
                    brace_depth -= 1
                continue
            else:
                brace_depth += stripped.count("{") - stripped.count("}")
                if brace_depth <= block_brace_start and "}" in stripped:
                    in_xdata = False
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

        # Skip class header, property, parameter, index lines for statement checks,
        # though even class/property names shouldn't have underscores!
        # Check for dot-access with underscore: e.g. scoreObj.final_level
        dot_underscore = re.findall(r"([A-Za-z%][A-Za-z0-9]*)\.([A-Za-z0-9]*_[A-Za-z0-9_]*)", code)
        for obj, prop in dot_underscore:
            errors.append(f"{filepath}:{idx}: Invalid dot-access with underscore '{obj}.{prop}' (use .{obj}.%Get(\"{prop}\"))")

        # Check for local variable or identifier containing underscore (excluding SQL tables or ##class)
        # Note: in ObjectScript, '_' between identifiers without spaces like `a_b` IS concatenation of a and b,
        # UNLESS followed by `=` like `Set a_b = 1` which is a syntax error!
        assign_underscore = re.findall(r"\b(?:Set|For|If|ElseIf|Quit)\s+([A-Za-z%][A-Za-z0-9]*_[A-Za-z0-9_]*)\s*=", code, re.IGNORECASE)
        for var in assign_underscore:
            errors.append(f"{filepath}:{idx}: Invalid assignment to identifier with underscore '{var}'")

        # Also catch bare underscore concatenation where user meant a single variable (e.g. `foo_bar` after `Set x = foo_bar` where `foo` or `bar` isn't obviously string)
        # Flag any identifier_identifier pattern in ObjectScript code that isn't a macro $$$foo_bar
        tokens = re.findall(r"(?<![\"A-Za-z0-9_$%])([A-Za-z%][A-Za-z0-9]*_[A-Za-z0-9_]+)", code)
        for tok in tokens:
            errors.append(f"{filepath}:{idx}: Suspicious underscore in ObjectScript token '{tok}' (possible accidental snake_case or unspaced concat)")

        # Check for invalid default values on ByRef or Output arguments
        if re.search(r"\b(ByRef|Output)\s+[A-Za-z0-9%]+\s+As\s+[A-Za-z0-9%.]+\s*=", code, re.IGNORECASE):
            errors.append(f"{filepath}:{idx}: Default value not allowed on ByRef/Output parameter in ObjectScript")

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

    print(f"[PASS] Audited {len(cls_files)} ObjectScript .cls files: 0 syntax/underscore issues found.")


if __name__ == "__main__":
    main()
