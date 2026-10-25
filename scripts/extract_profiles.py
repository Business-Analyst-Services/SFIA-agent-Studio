#!/usr/bin/env python3
"""Extract SFIA 9 illustrative skills profiles from the SFIA Foundation PDF into data/roles.json.

Usage: python3 scripts/extract_profiles.py path/to/sfia_9_illustrative_skills_profiles.pdf
Requires poppler's `pdftotext`. Spot-check the output against the PDF after running.
"""
import json, re, subprocess, sys, pathlib

pdf = sys.argv[1]
text = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout
pages = text.split("\f")

toc = re.findall(r"([A-Z][A-Za-z&()/ ,\-]+?) \.{5,} (\d+)", "\n".join(pages[1:7]))
toc = sorted({(int(p), n.strip()) for n, p in toc})
skill = re.compile(r"([A-Z][A-Za-z ,\-/()&]+?)\s{2,}(\d-\d|\d)\s+([A-Z]{4})\b")
FIX = {"Other": "Digital Product Development, Sales & Marketing"}

roles = []
for pg, name in toc:
    page = pages[pg - 1]
    fam = re.search(r"^\s*([A-Z][A-Z &;/\-()]{6,}?)\s{3,}", page, re.M)
    family = fam.group(1).replace("&AMP;", "&").title() if fam else "Other"
    family = re.sub(r" Role Family| Roles", "", family).replace(" And ", " & ").replace("Devops", "DevOps")
    family = FIX.get(family, family)
    head, _, rest = page.partition("Example Job Titles")
    desc = " ".join(l[52:].strip() for l in head.split("\n") if len(l) > 52 and "Back to Table" not in l and l[52:].strip())
    desc = re.sub(r"Illustrative SFIA Skills Profiles\s+\d+\s*", "", desc).strip()
    titles, core, other = [], [], []
    for line in rest.split("Business skills")[0].split("\n")[1:]:
        if line[:52].strip():
            titles.append(line[:52].strip())
        for m in skill.finditer(line):
            s = {"name": re.split(r"\s{2,}", m.group(1).strip())[-1], "levels": m.group(2), "code": m.group(3)}
            (core if m.start() < 125 else other).append(s)
    roles.append({"page": pg, "role": name, "family": family, "desc": desc,
                  "titles": re.sub(r"\s+", " ", " ".join(titles)), "core": core, "other": other})

out = pathlib.Path(__file__).resolve().parent.parent / "data" / "roles.json"
out.write_text(json.dumps(roles, indent=1))
print(f"{len(roles)} roles -> {out}")
