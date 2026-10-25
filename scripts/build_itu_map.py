import json
roles={r['role']:r for r in json.load(open('data/roles.json'))}
CAP={
"Strategy & Governance":["Stewardship of UTS Digital Strategy & UTS Cyber Strategy","IT Governance","IT Performance Management","IT Management & Policy","Innovation","Stakeholder Relations & Business Engagement","Digital advisory; support for Faculty and Division strategy, governance, and planning"],
"Financial Management":["Sourcing & Procurement","Cost & Budget Management"],
"People & Resources":["IT Human Resource Management","IT Leadership, Culture and Values","IT Organisational Design","IT Knowledge Management","Organisational Change","Training & Adoption"],
"Architecture":["Enterprise Architecture","Solution Ideation, Analysis & Design","Maintenance of digital roadmaps, standards, policies and principles","Digital advisory; support for Faculty and Divisions"],
"Infrastructure & Operations":["End User Computing","Access & Identity","Cloud, Hosting, & Infrastructure","Backup & Recovery","Disaster Recovery"],
"Data & BI":["Data Quality Management","BI & Reporting"],
"Service Management":["Service Desk","Knowledge Mgt","Incident & Problem Management","IT Change Management","Asset, license & configuration management","Capacity & Availability Management"],
"Security & Risk":["Risk Management","Cybersecurity Strategy & Roadmap","Audit and Compliance","Monitoring & Detection","Incident Response","Training & Awareness"],
"Applications":["Application Portfolio Management","Solution Configuration, Enhancement and Development","Solution testing and deployment","System Administration","Monitor, Schedule & Apply system updates","Application Support"],
"PPM & Projects":["IT Project Portfolio Management","Digital Initiative Process","Project Initiation","Project Governance & reporting","Service Transition","IT Project Management","Delivery Assurance"]}
# role -> [(domain, capability, 'lead'|'contributes')]  fit: strong|partial|none
L,C='lead','contributes'
M={
"Chief Information Officer":[("Strategy & Governance","Stewardship of UTS Digital Strategy & UTS Cyber Strategy",L),("Strategy & Governance","IT Governance",L),("People & Resources","IT Leadership, Culture and Values",L),("Strategy & Governance","IT Management & Policy",C),("Strategy & Governance","Stakeholder Relations & Business Engagement",C)],
"Chief Technology Officer":[("Strategy & Governance","Innovation",L),("Architecture","Maintenance of digital roadmaps, standards, policies and principles",C)],
"Chief Information Security Officer":[("Security & Risk","Cybersecurity Strategy & Roadmap",L),("Strategy & Governance","Stewardship of UTS Digital Strategy & UTS Cyber Strategy",L)],
"Chief Data Officer":[("Data & BI","Data Quality Management",L),("Data & BI","BI & Reporting",L),("Strategy & Governance","IT Governance",C)],
"Performance analysis practitioners":[("Strategy & Governance","IT Performance Management",L)],
"Business analysis practice management":[("Strategy & Governance","Digital advisory; support for Faculty and Division strategy, governance, and planning",L),("Strategy & Governance","Stakeholder Relations & Business Engagement",C)],
"Business analysis practitioners":[("Architecture","Solution Ideation, Analysis & Design",L),("PPM & Projects","Project Initiation",C),("Architecture","Digital advisory; support for Faculty and Divisions",C)],
"Product management practitioners":[("Applications","Application Portfolio Management",C),("Strategy & Governance","Innovation",C)],
"Service ownership practitioners":[("Applications","Application Portfolio Management",L),("Strategy & Governance","Stakeholder Relations & Business Engagement",C)],
"Agile product management":[("PPM & Projects","Digital Initiative Process",C)],
"Agile change agents":[("PPM & Projects","Digital Initiative Process",L),("People & Resources","Organisational Change",C)],
"Delivery management practitioners":[("PPM & Projects","IT Project Management",L),("PPM & Projects","Delivery Assurance",C)],
"Project delivery practice management":[("PPM & Projects","IT Project Portfolio Management",L),("PPM & Projects","Project Governance & reporting",L),("PPM & Projects","Delivery Assurance",L)],
"Project delivery practitioners":[("PPM & Projects","IT Project Management",L),("PPM & Projects","Project Initiation",L)],
"Service introduction practitioners":[("PPM & Projects","Service Transition",L)],
"Technology finance practitioners":[("Financial Management","Cost & Budget Management",L)],
"Technology procurement practitioners":[("Financial Management","Sourcing & Procurement",L)],
"Organisation design practitioners":[("People & Resources","IT Organisational Design",L)],
"Resource management practitioners":[("People & Resources","IT Human Resource Management",L)],
"Workforce planning practitioners":[("People & Resources","IT Human Resource Management",L)],
"Change management practitioners":[("People & Resources","Organisational Change",L)],
"Learning & development (L&D) practitioners":[("People & Resources","Training & Adoption",L),("Security & Risk","Training & Awareness",C)],
"Architecture practice management":[("Architecture","Maintenance of digital roadmaps, standards, policies and principles",L)],
"Enterprise architecture practitioners":[("Architecture","Enterprise Architecture",L),("Architecture","Digital advisory; support for Faculty and Divisions",L)],
"Solution architecture practitioners":[("Architecture","Solution Ideation, Analysis & Design",L)],
"Technical architecture practitioners":[("Architecture","Solution Ideation, Analysis & Design",C)],
"Data architecture practitioners":[("Architecture","Enterprise Architecture",C),("Data & BI","Data Quality Management",C)],
"Network architecture practitioners":[("Infrastructure & Operations","Cloud, Hosting, & Infrastructure",C)],
"Security architecture practitioners":[("Security & Risk","Cybersecurity Strategy & Roadmap",C),("Infrastructure & Operations","Access & Identity",C)],
"Application platform management practitioners":[("Applications","Application Portfolio Management",L)],
"Application development practitioners":[("Applications","Solution Configuration, Enhancement and Development",L)],
"Software engineering practitioners":[("Applications","Solution Configuration, Enhancement and Development",L)],
"Software engineering practice management":[("Applications","Solution Configuration, Enhancement and Development",C)],
"Testing practitioners":[("Applications","Solution testing and deployment",L)],
"Testing practice management":[("Applications","Solution testing and deployment",C),("PPM & Projects","Delivery Assurance",C)],
"DevOps automation engineer":[("Applications","Solution testing and deployment",C),("Applications","Monitor, Schedule & Apply system updates",C)],
"DevOps practice management":[("Applications","Solution testing and deployment",C)],
"Application support practitioners":[("Applications","Application Support",L),("Applications","Monitor, Schedule & Apply system updates",L),("Applications","System Administration",C)],
"Interaction design practitioners":[("Architecture","Solution Ideation, Analysis & Design",C)],
"User experience practitioners":[("Architecture","Solution Ideation, Analysis & Design",C)],
"User research practitioners":[("Architecture","Solution Ideation, Analysis & Design",C)],
"Service experience design practitioners":[("Architecture","Solution Ideation, Analysis & Design",C)],
"Content design practitioners":[("Architecture","Solution Ideation, Analysis & Design",C)],
"Accessibility practitioners":[("Applications","Solution testing and deployment",C)],
"Graphic design and visual communication practitioners":[("People & Resources","Training & Adoption",C)],
"Technical writing practitioners":[("Service Management","Knowledge Mgt",L),("People & Resources","IT Knowledge Management",C)],
"Security risk management, audit and compliance":[("Security & Risk","Risk Management",L),("Security & Risk","Audit and Compliance",L)],
"Security leadership, strategy and management":[("Security & Risk","Cybersecurity Strategy & Roadmap",L)],
"Security operations":[("Security & Risk","Monitoring & Detection",L)],
"Incident management practitioners":[("Security & Risk","Incident Response",L)],
"Vulnerability analysis practitioners":[("Security & Risk","Risk Management",C),("Security & Risk","Monitoring & Detection",C)],
"Penetration testing practitioners":[("Security & Risk","Audit and Compliance",C)],
"Service desk practitioners":[("Service Management","Service Desk",L)],
"Service operations practitioners":[("Service Management","Incident & Problem Management",L),("Service Management","IT Change Management",L),("Service Management","Asset, license & configuration management",L)],
"IT Service designer":[("PPM & Projects","Service Transition",C),("Service Management","Capacity & Availability Management",C)],
"Service management architecture practitioners":[("Service Management","IT Change Management",C),("Architecture","Maintenance of digital roadmaps, standards, policies and principles",C)],
"Site reliability engineer (SRE)":[("Service Management","Capacity & Availability Management",L),("Infrastructure & Operations","Disaster Recovery",C)],
"Infrastructure engineers":[("Infrastructure & Operations","Cloud, Hosting, & Infrastructure",L),("Infrastructure & Operations","Access & Identity",C)],
"Infrastructure operations practitioners":[("Infrastructure & Operations","Backup & Recovery",L),("Infrastructure & Operations","Disaster Recovery",L),("Applications","System Administration",L)],
"Infrastructure platform management practitioners":[("Infrastructure & Operations","Cloud, Hosting, & Infrastructure",L),("Service Management","Capacity & Availability Management",C)],
"Platform engineer":[("Infrastructure & Operations","Cloud, Hosting, & Infrastructure",C)],
"Data governance practitioners":[("Data & BI","Data Quality Management",L)],
"Data operations practitioners":[("Data & BI","Data Quality Management",C)],
"Data analytics practitioners":[("Data & BI","BI & Reporting",L)],
"Data engineering practitioners":[("Data & BI","BI & Reporting",C)],
"Data science practitioners":[("Data & BI","BI & Reporting",C)],
"AV Support Engineer":[("Infrastructure & Operations","End User Computing",C)],
"AV Installation Engineer":[("Infrastructure & Operations","End User Computing",C)],
"AV Systems Designer":[("Infrastructure & Operations","End User Computing",C)],
"Bid management practitioners":[("Financial Management","Sourcing & Procurement",C)],
}
FIT={k:'partial' for k in ["Product management practitioners","Agile product management","Graphic design and visual communication practitioners","AV Support Engineer","AV Installation Engineer","AV Systems Designer","Bid management practitioners","Data science practitioners","Interaction design practitioners","User experience practitioners","User research practitioners","Service experience design practitioners","Content design practitioners","Platform engineer","DevOps automation engineer","DevOps practice management"]}
NOFIT={"Machine learning engineering practitioners":"No AI/ML capability on the map. Closest is BI & Reporting, which undersells model build and MLOps.",
"Computational science practitioners":"Research computing (HPC, eResearch) is not on the map.",
"Digital marketing practitioners":"Marketing sits outside ITU at most universities.",
"Sales and sales support practitioners":"ITU buys rather than sells, so there is no sales capability.",
"Teaching practitioners":"Academic teaching belongs to faculties, not ITU."}
miss=set(roles)-set(M)-set(NOFIT); extra=set(M)-set(roles); print('missing',miss,'extra',extra)
covered={}
for r,xs in M.items():
  for d,c,t in xs:
    assert c in CAP[d],(r,c); covered.setdefault(c,[]).append((r,t))
for d,cs in CAP.items():
  for c in cs:
    leads=[r for r,t in covered.get(c,[]) if t==L]
    if not leads: print('NO LEAD:',d,'|',c, covered.get(c))
json.dump({"capabilities":CAP,"mapping":{r:[{"domain":d,"capability":c,"role":t} for d,c,t in xs] for r,xs in M.items()},"fit":{r:("partial" if r in FIT else "strong") for r in M},"unmapped":NOFIT},open('data/itu-map.json','w'),indent=1)
