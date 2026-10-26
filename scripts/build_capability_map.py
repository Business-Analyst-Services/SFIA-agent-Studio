#!/usr/bin/env python3
"""Build data/capability-map.json: an IT capability model organised by SFIA 9 categories and
subcategories, with the 75 illustrative role profiles placed on it.

Usage: python3 scripts/build_capability_map.py
Edit CAPS (capabilities and their SFIA skill codes) and PLACE (role placements), then re-run.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
L, C = "lead", "contributes"

# SFIA 9 category -> subcategory -> [(capability, [SFIA codes], proposed?)]
CAPS = {
 "Strategy and architecture": {
  "Strategy and planning": [("Digital and cyber strategy stewardship", ["ITSP", "SCTY"], False), ("Enterprise architecture", ["STPL"], False), ("Roadmaps, standards, policies and principles", ["ARCH"], False), ("Innovation", ["INOV", "EMRG"], False)],
  "Financial and value management": [("Cost and budget management", ["FMIT", "BUDF"], False), ("IT performance management", ["MEAS"], False), ("Demand and initiative intake", ["DEMM"], False)],
  "Security and privacy": [("Cybersecurity strategy and roadmap", ["SCTY"], False)],
  "Governance, risk and compliance": [("IT governance", ["GOVN"], False), ("Risk management", ["BURM"], False), ("Audit and compliance", ["AUDT"], False), ("Delivery assurance", ["QUAS"], False)],
  "Advice and guidance": [("Digital advisory for business units", ["CNSL"], False), ("Architecture advisory", ["TECH"], False)],
 },
 "Change and transformation": {
  "Change implementation": [("Project portfolio management", ["POMG"], False), ("Project initiation", ["PRMG"], False), ("Project management", ["PRMG"], False), ("Project governance and reporting", ["PROF"], False)],
  "Change analysis": [("Solution ideation, analysis and design", ["BUSA", "REQM", "BSMO"], False)],
  "Change planning": [("Organisational design", ["ORDI"], False), ("Organisational change", ["CIPM"], False)],
 },
 "Development and implementation": {
  "Systems development": [("Application portfolio management", ["PROD", "DLMG"], False), ("Solution configuration, enhancement and development", ["SWDN", "PROG", "SINT"], False), ("Solution testing and deployment", ["TEST", "DEPL"], False), ("Product management", ["PROD"], True)],
  "Data and analytics": [("Data quality management", ["DATM"], False), ("BI and reporting", ["BINT", "DAAN", "VISL"], False), ("AI and machine learning", ["MLNG", "DATS"], True)],
  "User centred design": [("Experience design", ["URCH", "CEXP", "ACIN", "UNAN", "HCEV", "USEV"], True)],
  "Content management": [("Knowledge management", ["KNOW"], False), ("Content design", ["ICPM", "INCA"], True)],
  "Computational science": [("Research computing", ["SCMO", "NUAN", "HPCC"], True)],
 },
 "Delivery and operation": {
  "Technology management": [("IT management and policy", ["ITMG"], False), ("Cloud, hosting and infrastructure", ["ITOP", "SYSP", "NTAS"], False), ("Platform engineering", ["SFEN", "DEPL"], True), ("End user computing", ["HSIN"], False), ("Audio-visual and learning spaces", ["HSIN", "ITOP"], True), ("Backup and recovery", ["ITOP"], False), ("System administration", ["SYSP"], False), ("System updates and releases", ["RELM", "DEPL"], False), ("Application support", ["ASUP"], False)],
  "Service management": [("Service desk", ["USUP"], False), ("Incident and problem management", ["USUP", "PBMG"], False), ("Change management", ["CHMG"], False), ("Asset, licence and configuration management", ["ASMG", "CFMG"], False), ("Capacity and availability management", ["CPMG", "AVMT"], False), ("Disaster recovery and continuity", ["COPL"], False), ("Service transition", ["SEAC"], False)],
  "Security services": [("Identity and access management", ["IAMT"], False), ("Security monitoring and detection", ["SCAD"], False), ("Security incident response", ["SCAD", "DGFS"], False)],
  "Data and records operations": [],
 },
 "People and skills": {
  "People management": [("Workforce and resource management", ["WFPL", "RESC"], False), ("Leadership, culture and values", ["PEMT", "EEXP"], False)],
  "Skills management": [("Training and adoption", ["ETDL", "TMCR"], False), ("Security training and awareness", ["ETDL", "SCTY"], False), ("Teaching and education", ["TEAC"], True)],
 },
 "Relationships and engagement": {
  "Stakeholder management": [("Stakeholder relations and engagement", ["RLMT"], False), ("Sourcing and procurement", ["SORC", "SUPP"], False)],
  "Sales and bid management": [("Bids and sales", ["BIDM", "SALE", "SSUP"], True)],
  "Marketing": [("Digital marketing", ["DIGM", "MKTG"], True)],
 },
}

PLACE = {
 "Chief Information Officer": [("Digital and cyber strategy stewardship", L), ("IT governance", L), ("Leadership, culture and values", L), ("IT management and policy", C), ("Stakeholder relations and engagement", C)],
 "Chief Technology Officer": [("Innovation", L), ("Roadmaps, standards, policies and principles", C)],
 "Chief Information Security Officer": [("Cybersecurity strategy and roadmap", L), ("Digital and cyber strategy stewardship", L)],
 "Chief Data Officer": [("Data quality management", L), ("BI and reporting", L), ("IT governance", C)],
 "Performance analysis practitioners": [("IT performance management", L)],
 "Business analysis practice management": [("Digital advisory for business units", L), ("Stakeholder relations and engagement", C)],
 "Business analysis practitioners": [("Solution ideation, analysis and design", L), ("Project initiation", C), ("Digital advisory for business units", C)],
 "Product management practitioners": [("Product management", L), ("Application portfolio management", C)],
 "Agile product management": [("Product management", C), ("Demand and initiative intake", C)],
 "Service ownership practitioners": [("Application portfolio management", L), ("Stakeholder relations and engagement", C)],
 "Agile change agents": [("Demand and initiative intake", L), ("Organisational change", C)],
 "Delivery management practitioners": [("Project management", L), ("Delivery assurance", C)],
 "Project delivery practice management": [("Project portfolio management", L), ("Project governance and reporting", L), ("Delivery assurance", L)],
 "Project delivery practitioners": [("Project management", L), ("Project initiation", L)],
 "Service introduction practitioners": [("Service transition", L)],
 "Technology finance practitioners": [("Cost and budget management", L)],
 "Technology procurement practitioners": [("Sourcing and procurement", L)],
 "Organisation design practitioners": [("Organisational design", L)],
 "Resource management practitioners": [("Workforce and resource management", L)],
 "Workforce planning practitioners": [("Workforce and resource management", L)],
 "Change management practitioners": [("Organisational change", L)],
 "Learning & development (L&D) practitioners": [("Training and adoption", L), ("Security training and awareness", C)],
 "Teaching practitioners": [("Teaching and education", L)],
 "Architecture practice management": [("Roadmaps, standards, policies and principles", L)],
 "Enterprise architecture practitioners": [("Enterprise architecture", L), ("Architecture advisory", L)],
 "Solution architecture practitioners": [("Solution ideation, analysis and design", L), ("Architecture advisory", C)],
 "Technical architecture practitioners": [("Solution ideation, analysis and design", C)],
 "Data architecture practitioners": [("Enterprise architecture", C), ("Data quality management", C)],
 "Network architecture practitioners": [("Cloud, hosting and infrastructure", C)],
 "Security architecture practitioners": [("Cybersecurity strategy and roadmap", C), ("Identity and access management", C)],
 "Application platform management practitioners": [("Application portfolio management", L)],
 "Application development practitioners": [("Solution configuration, enhancement and development", L)],
 "Software engineering practitioners": [("Solution configuration, enhancement and development", L)],
 "Software engineering practice management": [("Solution configuration, enhancement and development", C)],
 "Testing practitioners": [("Solution testing and deployment", L)],
 "Testing practice management": [("Solution testing and deployment", C), ("Delivery assurance", C)],
 "DevOps automation engineer": [("Platform engineering", C), ("Solution testing and deployment", C), ("System updates and releases", C)],
 "DevOps practice management": [("Platform engineering", L), ("Solution testing and deployment", C)],
 "Platform engineer": [("Platform engineering", L), ("Cloud, hosting and infrastructure", C)],
 "Application support practitioners": [("Application support", L), ("System updates and releases", L), ("System administration", C)],
 "User experience practitioners": [("Experience design", L), ("Solution ideation, analysis and design", C)],
 "User research practitioners": [("Experience design", C)],
 "Interaction design practitioners": [("Experience design", C)],
 "Service experience design practitioners": [("Experience design", C)],
 "Accessibility practitioners": [("Experience design", C), ("Solution testing and deployment", C)],
 "Content design practitioners": [("Content design", L)],
 "Graphic design and visual communication practitioners": [("Content design", C), ("Digital marketing", C)],
 "Technical writing practitioners": [("Knowledge management", L), ("Content design", C)],
 "Security risk management, audit and compliance": [("Risk management", L), ("Audit and compliance", L)],
 "Security leadership, strategy and management": [("Cybersecurity strategy and roadmap", L)],
 "Security operations": [("Security monitoring and detection", L)],
 "Incident management practitioners": [("Security incident response", L)],
 "Vulnerability analysis practitioners": [("Risk management", C), ("Security monitoring and detection", C)],
 "Penetration testing practitioners": [("Audit and compliance", C)],
 "Service desk practitioners": [("Service desk", L)],
 "Service operations practitioners": [("Incident and problem management", L), ("Change management", L), ("Asset, licence and configuration management", L)],
 "IT Service designer": [("Service transition", C), ("Capacity and availability management", C)],
 "Service management architecture practitioners": [("Change management", C), ("Roadmaps, standards, policies and principles", C)],
 "Site reliability engineer (SRE)": [("Capacity and availability management", L), ("Disaster recovery and continuity", C)],
 "Infrastructure engineers": [("Cloud, hosting and infrastructure", L), ("Identity and access management", C)],
 "Infrastructure operations practitioners": [("Backup and recovery", L), ("Disaster recovery and continuity", L), ("System administration", L)],
 "Infrastructure platform management practitioners": [("Cloud, hosting and infrastructure", L), ("Capacity and availability management", C)],
 "Data governance practitioners": [("Data quality management", L)],
 "Data operations practitioners": [("Data quality management", C), ("AI and machine learning", C)],
 "Data analytics practitioners": [("BI and reporting", L)],
 "Data engineering practitioners": [("BI and reporting", C)],
 "Data science practitioners": [("AI and machine learning", L), ("BI and reporting", C)],
 "Machine learning engineering practitioners": [("AI and machine learning", L)],
 "Computational science practitioners": [("Research computing", L)],
 "AV Installation Engineer": [("Audio-visual and learning spaces", C)],
 "AV Support Engineer": [("Audio-visual and learning spaces", L), ("End user computing", C)],
 "AV Systems Designer": [("Audio-visual and learning spaces", C)],
 "Bid management practitioners": [("Bids and sales", L)],
 "Sales and sales support practitioners": [("Bids and sales", C)],
 "Digital marketing practitioners": [("Digital marketing", L)],
}

def main():
    roles = {r["role"] for r in json.loads((ROOT / "data/roles.json").read_text())}
    assert roles == set(PLACE), (roles ^ set(PLACE))
    where = {}
    for cat, subs in CAPS.items():
        for sub, caps in subs.items():
            for name, codes, proposed in caps:
                assert name not in where, name
                where[name] = (cat, sub)
    for r, xs in PLACE.items():
        for cap, _ in xs:
            assert cap in where, (r, cap)
    out = {
        "framework": "SFIA 9 categories and subcategories",
        "categories": [{"name": cat, "subcategories": [{"name": sub, "capabilities": [{"name": n, "skills": c, "proposed": p} for n, c, p in caps]} for sub, caps in subs.items()]} for cat, subs in CAPS.items()],
        "mapping": {r: [{"category": where[c][0], "subcategory": where[c][1], "capability": c, "role": t} for c, t in xs] for r, xs in PLACE.items()},
    }
    (ROOT / "data/capability-map.json").write_text(json.dumps(out, indent=1))
    leads = {c for xs in PLACE.values() for c, t in xs if t == L}
    caps = [n for subs in CAPS.values() for cs in subs.values() for n, _, _ in cs]
    print(f"{len(PLACE)} roles, {len(caps)} capabilities ({sum(p for s in CAPS.values() for cs in s.values() for *_, p in cs)} proposed); no lead: {[c for c in caps if c not in leads]}")

if __name__ == "__main__":
    main()
