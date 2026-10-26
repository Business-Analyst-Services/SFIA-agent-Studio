#!/usr/bin/env python3
"""Build data/domains.json: domain packs that make Muster industry-agnostic.

Each pack lists the domain's systems of record (SoR), the standard each speaks, how an MCP
connection is obtained, what agents may do (read / write with approval / never), and an
end-to-end scenario in the same shape as data/value-streams.json so the Muster demo can run it.
Usage: python3 scripts/build_domains.py
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OFF, COM, BUILD = "Official MCP", "Community MCP (review first)", "Build an MCP adapter over the vendor API"

def sor(id, name, holds, examples, standard, route, read, write, never, cap, agents, data_class):
    return {"id": id, "name": name, "holds": holds, "examples": examples, "standard": standard, "mcp": route,
            "read": read, "write": write, "never": never, "maxRisk": cap, "agents": agents, "dataClass": data_class}

def step(agent, capability, task, actions, handoff):
    return {"agent": agent, "capability": capability, "task": task, "handoff": handoff,
            "actions": [dict(tool=t, risk=r, summary=s, result=o, **({"artefact": a} if a else {})) for t, r, s, o, a in actions]}

def sec(h, text=None, items=None, table=None):
    o = {"h": h}
    if text: o["text"] = text
    if items: o["items"] = items
    if table: o["table"] = table
    return o

def art(kind, system, id, title, fields, items=None, h="Detail"):
    o = {"kind": kind, "system": system, "id": id, "title": title, "fields": fields}
    if items: o["sections"] = [{"h": h, "items": items}]
    return o

PRACTICES = [
    {"name": "Elicitation and collaboration", "skills": ["RLMT", "REQM"], "agents": ["business-analysis", "user-research"]},
    {"name": "Requirements analysis", "skills": ["REQM", "BUSA"], "agents": ["business-analysis"]},
    {"name": "Process modelling", "skills": ["BSMO", "BPRE"], "agents": ["business-analysis", "service-experience-design"]},
    {"name": "Data analysis", "skills": ["DTAN", "DAAN"], "agents": ["data-analytics", "data-architecture"]},
    {"name": "Solution evaluation", "skills": ["FEAS", "BENM"], "agents": ["business-analysis", "solution-architecture"]},
    {"name": "Stakeholder management", "skills": ["RLMT"], "agents": ["business-analysis-practice-management"]},
    {"name": "UAT and validation", "skills": ["BPTS", "TEST"], "agents": ["testing", "business-analysis"]},
    {"name": "Change enablement", "skills": ["CIPM", "OCEN"], "agents": ["change-management", "agile-change-agents"]},
]

D = []
def domain(id, name, colour, roles, challenges, regulations, value, sors, scenario):
    D.append({"id": id, "name": name, "colour": colour, "roles": roles, "challenges": challenges, "regulations": regulations,
              "value": value, "systemsOfRecord": sors, "scenario": scenario})

# 1 Blockchain
domain("blockchain", "Blockchain", "#5b3fd1", ["Blockchain BA", "Product analyst", "Smart contract analyst"],
 "Interoperability, user adoption, governance", "AML/CTF, travel rule, digital asset licensing, privacy",
 "Turns decentralised ideas into trusted business outcomes",
 [sor("ledger", "Distributed ledger and node provider", "On-chain transactions, smart contract state", ["Ethereum", "Hyperledger Fabric", "Node providers such as Infura or Alchemy"], "JSON-RPC, contract ABIs", BUILD,
      "Read balances, events and contract state", "Deploy to test networks only, with approval", "Sign or broadcast mainnet transactions", "write", ["software-engineering", "testing", "security-architecture"], "Public ledger; keys are secret"),
  sor("custody", "Digital asset custody", "Wallets, keys, transfer policies", ["Fireblocks", "BitGo", "Anchorage"], "Vendor REST API", BUILD,
      "Read wallet balances and policy settings", "None", "Move assets or change signing policies", "read", ["security-architecture", "security-risk-management-audit-and-compliance"], "Highly restricted"),
  sor("chainrisk", "Blockchain analytics and AML screening", "Wallet risk scores, sanctions exposure", ["Chainalysis", "Elliptic", "TRM Labs"], "Vendor REST API", BUILD,
      "Screen wallets and transactions", "Raise a case for review, with approval", "Clear or close an AML alert", "write", ["security-risk-management-audit-and-compliance"], "Confidential"),
  sor("kyc", "Customer identity (KYC)", "Identity checks and onboarding status", ["Sumsub", "Onfido", "Jumio"], "Vendor REST API", BUILD,
      "Read verification status", "None", "Approve or reject a customer", "read", ["business-analysis"], "Personal information")],
 {"id": "domain-blockchain", "name": "Tokenised asset launch", "why": "A tokenised product goes from idea to a tested contract.",
  "trigger": {"user": "Head of Digital Assets", "msg": "Can we launch tokenised invoice financing next quarter?"},
  "steps": [step("business-analysis", "Solution ideation, analysis and design", "Define rules and compliance needs", [("confluence.create_page", "write", "Write token rules and compliance requirements", "Requirements page published", art("Page", "Confluence", "DA-118", "Tokenised invoices: business rules", {"Status": "Draft"}, ["Who can hold tokens (verified businesses only)", "Transfer limits and travel-rule data", "Redemption at invoice maturity"], "Rules"))], "Rules and compliance needs agreed"),
            step("security-risk-management-audit-and-compliance", "Risk management", "Screen counterparties", [("chainrisk.screen_wallets", "read", "Screen pilot investor wallets", "12 wallets screened, 1 flagged for review", None)], "1 wallet excluded from pilot"),
            step("software-engineering", "Solution configuration, enhancement and development", "Build the contract", [("ledger.deploy_testnet", "write", "Deploy the contract to a test network", "Contract deployed to testnet", art("Contract deployment", "Ledger (testnet)", "0x7a…c21", "InvoiceToken v0.3 on testnet", {"Network": "Test network", "Audit": "Pending", "Owner": "Multisig (2 of 3)"}))], "Testnet contract ready"),
            step("testing", "Solution testing and deployment", "Test the rules on-chain", [("ledger.call_contract", "read", "Run transfer and redemption tests", "34 of 34 tests pass", None)], "Ready for external audit")],
  "outcome": "The tokenised invoice product is defined, screened and running on a test network. Mainnet deployment stays a human decision after the external audit."})

# 2 Fintech
domain("fintech", "Fintech", "#0f8a5f", ["Fintech BA", "Product analyst", "Risk and compliance analyst"],
 "Compliance, data security, legacy integration", "Open banking / Consumer Data Right, AML/CTF, PCI DSS, responsible lending",
 "Links innovation with financial control and customer value",
 [sor("corebank", "Core banking ledger", "Accounts, balances, loans, repayments", ["Mambu", "Thought Machine", "Temenos"], "Vendor REST APIs, ISO 20022", BUILD,
      "Read accounts, arrears and product settings", "Change product settings in non-production, with approval", "Post transactions or change customer balances", "write", ["data-analytics", "software-engineering"], "Financial, personal"),
  sor("payments", "Payments platform", "Payment intents, refunds, webhooks", ["Stripe", "Adyen"], "REST API, webhooks", OFF + " (Stripe)",
      "Read payments, failures and disputes", "Create webhooks and test-mode objects, with approval", "Issue refunds or payouts", "write", ["software-engineering", "data-analytics"], "PCI scope: never handle card numbers"),
  sor("openbank", "Open banking data", "Consented customer banking data", ["CDR data holders (AU)", "Open Banking UK"], "CDR / FAPI standards", BUILD,
      "Read consented data for the stated purpose", "None", "Use data beyond the customer's consent", "read", ["data-analytics"], "Consented personal data"),
  sor("aml", "AML and transaction monitoring", "Alerts, cases, suspicious matter reports", ["NICE Actimize", "Feedzai"], "Vendor API", BUILD,
      "Read alert volumes and rule performance", "None", "Close alerts or lodge reports", "read", ["security-risk-management-audit-and-compliance"], "Restricted")],
 {"id": "domain-fintech", "name": "Repayment reminders", "why": "Fewer missed BNPL repayments without breaking lending rules.",
  "trigger": {"user": "Product Owner, Lending", "msg": "Missed repayments are up 9%. Can we add smart reminders?"},
  "steps": [step("data-analytics", "BI and reporting", "Size the problem", [("corebank.query_arrears", "read", "Analyse missed repayments by cohort", "Most misses are 1–3 days late, on payday mismatches", None)], "Payday mismatch is the main driver"),
            step("business-analysis", "Solution ideation, analysis and design", "Define the feature", [("jira.create_epic", "write", "Create the reminders epic with stories", "LEND-77 created with 5 stories", art("Epic", "Jira", "LEND-77", "Smart repayment reminders", {"Stories": "5", "Compliance review": "Required"}, ["Remind 2 days before due date", "Offer to move date to payday (once per term)", "Respect contact preferences and hardship flags"], "Stories"))], "Feature defined with compliance checks"),
            step("security-risk-management-audit-and-compliance", "Audit and compliance", "Check lending and privacy rules", [("aml.get_rule_settings", "read", "Confirm no conflict with hardship and monitoring rules", "No conflicts; hardship flag must suppress reminders", None)], "Approved with one condition"),
            step("software-engineering", "Solution configuration, enhancement and development", "Build it", [("payments.create_webhook", "write", "Create a test-mode webhook for upcoming payments", "Webhook created in test mode", art("Webhook", "Stripe (test mode)", "we_test_41", "Upcoming payment notifications", {"Mode": "Test", "Events": "invoice.upcoming"}))], "Ready for pilot")],
  "outcome": "Smart reminders are built in test mode and approved by compliance, with hardship customers excluded. Turning them on in production needs a release approval."})

# 3 Technology & software
domain("technology", "Technology and software", "#3b5bdb", ["Systems analyst", "Product owner", "Agile BA"],
 "Changing requirements, time to market, stakeholder alignment", "Privacy, security, accessibility, IP",
 "Bridges business and engineering to build scalable solutions",
 [sor("worktracking", "Work management", "Epics, stories, sprints", ["Jira", "Azure DevOps", "Linear"], "REST, JQL", OFF + " (Atlassian, Linear)",
      "Read backlog and sprint data", "Create and update issues, with approval at level 4", "Delete projects or bulk-edit history", "write", ["product-management", "business-analysis"], "Internal"),
  sor("code", "Source control and CI", "Code, pull requests, pipelines", ["GitHub", "GitLab"], "REST, GraphQL", OFF + " (GitHub, GitLab)",
      "Read code, PRs and checks", "Open pull requests, with approval", "Merge to main or change branch protection", "write", ["software-engineering", "testing"], "Confidential IP"),
  sor("flags", "Feature flags", "Rollout rules per feature", ["LaunchDarkly", "Vercel Flags", "Unleash"], "REST API", COM,
      "Read flag state", "Change rollout percentage, with approval", "Turn on 100% in production without approval", "destructive", ["platform-engineer"], "Internal"),
  sor("observability", "Observability", "Metrics, logs, traces, errors", ["Datadog", "Sentry", "Grafana"], "REST APIs", OFF + " (Datadog, Sentry, Grafana)",
      "Read metrics and errors", "Create monitors, with approval", "Mute alerts in production", "write", ["data-analytics", "platform-engineer"], "Internal")],
 {"id": "domain-technology", "name": "AI feature rollout", "why": "A new AI feature reaches users safely, in stages.",
  "trigger": {"user": "Product Owner", "msg": "Let's roll out AI search to customers, carefully."},
  "steps": [step("product-management", "Product management", "Frame the release", [("jira.create_epic", "write", "Create the rollout epic with success measures", "PROD-301 created", art("Epic", "Jira", "PROD-301", "AI search: staged rollout", {"Success measure": "Search success +10%", "Guardrail": "Error rate under 0.5%"}))], "Success and guardrail measures set"),
            step("software-engineering", "Solution configuration, enhancement and development", "Prepare the release", [("github.create_pull_request", "write", "Add the feature behind a flag", "PR #880 opened", art("Pull request", "GitHub", "PR #880", "AI search behind flag ai-search", {"Checks": "Passing", "Reviewers": "2"}))], "Code ready behind a flag"),
            step("platform-engineer", "Platform engineering", "Roll out in stages", [("flags.set_rollout", "destructive", "Turn on AI search for 10% of users", "10% rollout live", art("Flag change", "Feature flags", "ai-search", "Rollout set to 10%", {"Before": "0%", "After": "10%", "Approved by": "You"}))], "10% of users on AI search"),
            step("data-analytics", "BI and reporting", "Check the guardrails", [("observability.query_metrics", "read", "Compare search success and errors", "Search success +12%; errors 0.2%", None)], "Safe to expand")],
  "outcome": "AI search is live for 10% of users, beating its target with errors well under the guardrail. Expanding further is one approval away."})

# 4 Healthcare
domain("healthcare", "Healthcare", "#0e8a9a", ["Clinical BA", "Health systems analyst", "Process improvement analyst"],
 "Interoperability, patient safety, fragmented systems", "Privacy Act and health records law, clinical governance, HIPAA where applicable",
 "Improves outcomes by aligning care, process and technology",
 [sor("emr", "Electronic medical record (EMR)", "Clinical notes, orders, results, medications", ["Epic", "Oracle Health", "InterSystems TrakCare"], "HL7 FHIR R4, SMART on FHIR", COM + ": FHIR servers such as WSO2's",
      "Read de-identified or consented data for an approved purpose", "None", "Write to any clinical record, order or medication", "read", ["data-analytics", "business-analysis"], "Health information (highly sensitive)"),
  sor("pas", "Patient administration (PAS)", "Admissions, discharges, transfers, bookings", ["Epic Cadence/Grand Central", "iPM", "TrakCare PAS"], "HL7 v2 ADT, FHIR Encounter", BUILD,
      "Read admission and discharge events", "None", "Admit, discharge or move patients", "read", ["business-analysis", "data-analytics"], "Health information"),
  sor("terminology", "Clinical terminology", "SNOMED CT, medicines terminology", ["Ontoserver", "NCTS"], "FHIR terminology services", BUILD,
      "Look up codes and value sets", "None", "Change published value sets", "read", ["data-architecture"], "Public reference data"),
  sor("safety", "Incident and safety reporting", "Clinical incidents and risk reviews", ["RiskMan", "Datix"], "Vendor API", BUILD,
      "Read de-identified incident trends", "Draft a review record, with approval", "Close an incident or change its severity", "write", ["security-risk-management-audit-and-compliance"], "Sensitive")],
 {"id": "domain-healthcare", "name": "Reduce discharge delays", "why": "Patients go home sooner, without touching clinical records.",
  "trigger": {"user": "Director of Patient Flow", "msg": "Discharges after 11am are blocking beds. What's going on?"},
  "steps": [step("data-analytics", "BI and reporting", "Find the pattern", [("pas.query_adt_events", "read", "Analyse 90 days of de-identified discharge times", "61% of discharges after 11am; pharmacy wait is the top delay", None)], "Pharmacy wait is the biggest delay"),
            step("service-experience-design", "Experience design", "Map the journey", [("miro.create_board", "write", "Map the discharge journey with ward staff", "Journey map created", art("Board", "Miro", "BRD-discharge", "Discharge journey map", {"Workshops": "2 wards", "Pain points": "7"}, ["Medication charts finalised late", "Transport booked on the day", "Families not told the plan"], "Top pain points"))], "Journey mapped with staff"),
            step("business-analysis", "Solution ideation, analysis and design", "Propose changes", [("emr.update_care_plan", "write", "Add discharge plans to patients' records", "Blocked", None), ("confluence.create_page", "write", "Write the improvement options paper", "Options paper published", art("Page", "Confluence", "HLTH-52", "Discharge improvement options", {"Clinical sign-off": "Required"}, ["Medication review the day before discharge", "Criteria-led discharge for low-risk patients", "Discharge lounge from 9am"], "Options"))], "Options ready for clinical review"),
            step("change-management", "Organisational change", "Plan the change", [("m365.create_document", "write", "Draft the change and communication plan", "Change plan drafted", None)], "Pilot planned for one ward")],
  "outcome": "The main delay is pharmacy, and three options are ready for clinical review with a one-ward pilot planned. No agent wrote to the EMR: clinical changes stay with clinicians."})

# 5 Logistics
domain("logistics", "Logistics", "#e07a1f", ["Supply chain BA", "Operations analyst", "Process analyst"],
 "Delays, inventory visibility, cost pressures", "Transport compliance, customs, chain of responsibility, WHS",
 "Optimises movement of goods, information and decisions",
 [sor("wms", "Warehouse management (WMS)", "Stock, locations, picks, waves", ["Manhattan", "Blue Yonder", "SAP EWM"], "Vendor APIs, GS1 standards", BUILD,
      "Read stock, pick rates and wave plans", "None", "Adjust stock or release waves", "read", ["data-analytics", "business-analysis"], "Commercial"),
  sor("tms", "Transport management (TMS)", "Loads, routes, carriers, delivery status", ["Oracle OTM", "MercuryGate", "Descartes"], "Vendor APIs", BUILD,
      "Read shipments and on-time performance", "Change routing rules in test, with approval", "Tender loads or cancel bookings", "write", ["data-analytics", "software-engineering"], "Commercial"),
  sor("telematics", "Telematics and IoT", "Vehicle location, driver hours, temperature", ["Samsara", "Geotab"], "Vendor REST APIs", BUILD,
      "Read location and dwell times", "None", "Change driver hours records", "read", ["data-analytics"], "Personal (driver data)"),
  sor("edi", "Partner messaging (EDI)", "Orders, ASNs, invoices with partners", ["GS1 EDI", "EDIFACT", "SPS Commerce"], "EDI / GS1 XML", BUILD,
      "Read message status and failures", "Resend a failed message, with approval", "Send new orders or invoices to partners", "write", ["service-operations"], "Commercial")],
 {"id": "domain-logistics", "name": "Cut late deliveries", "why": "On-time delivery improves through better routing.",
  "trigger": {"user": "Operations Manager", "msg": "On-time delivery fell to 87% in the north region. Fix it?"},
  "steps": [step("data-analytics", "BI and reporting", "Find the cause", [("tms.query_shipments", "read", "Analyse late deliveries by route and depot", "Late loads cluster on 3 routes leaving after 2pm", None), ("telematics.get_dwell_times", "read", "Check depot dwell times", "Average 48-minute dwell at Depot 4", None)], "Late departures from Depot 4"),
            step("business-analysis", "Solution ideation, analysis and design", "Redesign the process", [("confluence.create_page", "write", "Model the current and future dispatch process", "Process models published", art("Page", "Confluence", "OPS-209", "Depot 4 dispatch: current and future process", {"Saving": "About 35 minutes per load"}, ["Pre-stage loads by 1pm", "Move cut-off for north routes to 12:30", "Dock scheduling by route"], "Future state"))], "Future process agreed"),
            step("software-engineering", "Solution configuration, enhancement and development", "Change the routing rules", [("tms.update_routing_rules", "write", "Apply new cut-offs in the test environment", "Rules updated in test", art("Configuration change", "TMS (test)", "RULE-N12", "North region cut-off 12:30", {"Environment": "Test", "Routes": "3"}))], "Rules ready to promote"),
            step("service-operations", "Change management", "Promote safely", [("servicenow.create_change", "write", "Raise a change to promote the rules", "CHG0041 approved for Monday", None)], "Live Monday")],
  "outcome": "Late loads were caused by afternoon departures from Depot 4. New cut-offs and pre-staging go live Monday, aiming to lift on-time delivery back above 95%."})

# 6 Insurance
domain("insurance", "Insurance", "#2f4ab5", ["Insurance BA", "Claims analyst", "Policy process analyst"],
 "Legacy systems, fraud, complex products", "Privacy, prudential standards (for example APRA CPS 230 and 234), consumer obligations",
 "Balances customer service, compliance and risk outcomes",
 [sor("policy", "Policy administration", "Policies, cover, premiums, endorsements", ["Guidewire PolicyCenter", "Duck Creek", "Majesco"], "ACORD, vendor cloud APIs", BUILD,
      "Read products, policies and rating rules", "None", "Issue, change or cancel policies", "read", ["business-analysis", "data-analytics"], "Personal, financial"),
  sor("claims", "Claims management", "Claims, reserves, payments, documents", ["Guidewire ClaimCenter", "Duck Creek Claims"], "ACORD, vendor cloud APIs", BUILD,
      "Read claim volumes, cycle times and steps", "Create test claims in non-production, with approval", "Pay, reserve or decline real claims", "write", ["business-analysis", "testing"], "Personal, sensitive"),
  sor("crm", "Customer CRM", "Customers, interactions, complaints", ["Salesforce Financial Services Cloud", "Dynamics 365"], "REST APIs", OFF + " (Salesforce)",
      "Read contact history and complaints", "Create follow-up tasks, with approval", "Change consent or contact preferences", "write", ["user-experience", "business-analysis"], "Personal"),
  sor("fraud", "Fraud analytics", "Fraud scores and investigations", ["SAS Fraud", "Shift Technology"], "Vendor API", BUILD,
      "Read fraud rule performance", "None", "Clear or refer a claim", "read", ["data-analytics"], "Restricted")],
 {"id": "domain-insurance", "name": "Digital motor claims", "why": "Customers lodge motor claims online in minutes.",
  "trigger": {"user": "Claims GM", "msg": "Phone lodgement takes 25 minutes. Can we go digital for motor claims?"},
  "steps": [step("data-analytics", "BI and reporting", "Understand current claims", [("claims.query_cycle_times", "read", "Analyse motor claim lodgement and cycle times", "70% of motor claims are simple; lodgement averages 25 minutes", None)], "Simple claims are the target"),
            step("user-experience", "Experience design", "Design the journey", [("figma.create_prototype", "write", "Prototype the online lodgement flow", "Prototype tested with 8 customers", art("Prototype", "Figma", "FIG-claims", "Online motor claim lodgement", {"Tested with": "8 customers", "Median time": "6 minutes"}))], "Prototype validated"),
            step("business-analysis", "Solution ideation, analysis and design", "Specify the build", [("jira.create_epic", "write", "Create the digital lodgement epic", "CLM-140 created", art("Epic", "Jira", "CLM-140", "Digital motor claim lodgement", {"Stories": "9", "Fraud checks": "Included"}))], "Build specified"),
            step("testing", "Solution testing and deployment", "Test end to end", [("claims.create_test_claim", "write", "Lodge 50 test claims in non-production", "50 test claims processed correctly", None)], "Ready for release")],
  "outcome": "Online motor claim lodgement is designed, specified and tested, cutting lodgement from 25 to about 6 minutes. Real claims are never paid or declined by an agent."})

# 7 Finance
domain("finance", "Finance", "#7a5a12", ["Finance BA", "Data analyst", "Treasury and operations analyst"],
 "Reporting accuracy, risk, changing markets", "SOX-style controls, Basel-style capital rules, data governance",
 "Transforms data into decision-ready financial insight",
 [sor("erp", "ERP general ledger", "Journals, cost centres, actuals vs budget", ["SAP S/4HANA", "Oracle Fusion", "Workday Financials"], "OData, REST", COM + " or third-party connectors",
      "Read balances and journals", "None", "Post or reverse journals", "read", ["data-engineering", "technology-finance"], "Financial (restricted)"),
  sor("treasury", "Treasury management", "Cash positions, FX, payments", ["Kyriba", "SAP Treasury"], "Vendor API, ISO 20022", BUILD,
      "Read cash positions", "None", "Release payments or trades", "read", ["technology-finance"], "Restricted"),
  sor("warehouse", "Finance data warehouse", "Curated financial data marts", ["Snowflake", "Databricks"], "SQL", OFF + " (Snowflake, Databricks)",
      "Query curated marts", "Create views in a sandbox schema, with approval", "Change production tables", "write", ["data-engineering", "data-analytics"], "Financial"),
  sor("epm", "Planning and consolidation (EPM)", "Budgets, forecasts, consolidations", ["Anaplan", "Oracle EPM", "Workday Adaptive"], "Vendor APIs", BUILD,
      "Read budgets and forecasts", "None", "Submit or lock forecasts", "read", ["performance-analysis"], "Financial")],
 {"id": "domain-finance", "name": "Month-end variance insight", "why": "Finance explains variances in hours, not days.",
  "trigger": {"user": "Financial Controller", "msg": "Operating costs are 6% over forecast. I need the why by tomorrow."},
  "steps": [step("data-engineering", "BI and reporting", "Pull the numbers", [("erp.read_balances", "read", "Extract actuals by cost centre", "Actuals extracted for 142 cost centres", None), ("warehouse.create_view", "write", "Create a variance view in the sandbox", "Variance view created", art("Data view", "Snowflake (sandbox)", "VW_OPEX_VAR", "Opex variance by cost centre", {"Schema": "Sandbox", "Rows": "142"}))], "Variance data ready"),
            step("data-analytics", "BI and reporting", "Find the drivers", [("warehouse.query", "read", "Rank variance drivers", "Cloud spend +$410k and contractors +$260k explain 80%", None)], "Two drivers explain 80%"),
            step("performance-analysis", "IT performance management", "Compare to forecast", [("epm.read_forecast", "read", "Check forecast assumptions", "Forecast assumed 3% cloud growth; actual 14%", None)], "Forecast assumption was too low"),
            step("business-analysis", "Solution ideation, analysis and design", "Write it up", [("m365.create_document", "write", "Draft the variance commentary", "Commentary drafted", art("Document", "Microsoft 365", "FIN-VAR-10", "October opex variance commentary", {"Variance": "+6% ($820k)"}, ["Cloud spend +$410k: new analytics workloads", "Contractors +$260k: delayed hiring", "Action: reforecast cloud at 14% growth"], "Drivers"))], "Commentary ready")],
  "outcome": "The 6% overspend is explained: cloud growth and delayed hiring account for 80%. Commentary and a reforecast recommendation are ready. No journals were touched."})

# 8 Accounting
domain("accounting", "Accounting", "#0f6e64", ["Accounting BA", "Process analyst", "ERP and finance systems analyst"],
 "Manual work, compliance burden, reconciliation issues", "Accounting standards, tax law, audit controls",
 "Streamlines controls and processes to improve accuracy and efficiency",
 [sor("ledger", "Accounting ledger", "Invoices, bills, bank feeds, reconciliations", ["Xero", "MYOB", "QuickBooks", "NetSuite"], "REST APIs", COM + " (for example Xero's) or vendor AI connectors",
      "Read invoices, bank lines and reconciliation status", "Create draft bills or bank rules, with approval", "Approve, pay or void transactions", "write", ["business-analysis", "data-analytics"], "Financial"),
  sor("expenses", "Expense management", "Claims, receipts, policies", ["SAP Concur", "Expensify", "Emburse"], "REST APIs", BUILD,
      "Read claims and policy breaches", "None", "Approve claims", "read", ["data-analytics"], "Personal, financial"),
  sor("payroll", "Payroll", "Pay runs, leave, super", ["Employment Hero", "ADP", "Workday Payroll"], "Vendor APIs", BUILD,
      "Read pay run totals (no individual pay)", "None", "Run or change payroll", "read", ["technology-finance"], "Highly sensitive"),
  sor("tax", "Tax lodgement", "BAS, PAYG, tax returns", ["ATO Standard Business Reporting (via the ledger)"], "SBR, XBRL", BUILD,
      "Read lodgement status", "None", "Lodge anything with the tax office", "read", ["security-risk-management-audit-and-compliance"], "Regulated")],
 {"id": "domain-accounting", "name": "Faster month-end close", "why": "Close the books in 4 days instead of 8.",
  "trigger": {"user": "Finance Manager", "msg": "Month-end takes 8 days, mostly reconciliations. Help?"},
  "steps": [step("data-analytics", "BI and reporting", "Find the bottleneck", [("ledger.list_unreconciled", "read", "Analyse unreconciled bank lines", "1,240 lines a month; 70% are 6 recurring suppliers", None)], "Six suppliers cause most of the work"),
            step("business-analysis", "Solution ideation, analysis and design", "Design the fix", [("ledger.create_bank_rule", "write", "Create bank rules for the 6 recurring suppliers", "6 bank rules created", art("Bank rules", "Accounting ledger", "RULES-6", "Auto-match rules for recurring suppliers", {"Rules": "6", "Expected auto-match": "About 870 lines a month"}))], "Rules in place"),
            step("security-risk-management-audit-and-compliance", "Audit and compliance", "Check the controls", [("ledger.read_audit_trail", "read", "Confirm rules keep segregation of duties", "Controls intact: rules match only; approvals unchanged", None)], "Controls confirmed"),
            step("change-management", "Organisational change", "Embed it", [("m365.create_document", "write", "Update the close checklist and train the team", "New 4-day close checklist published", art("Checklist", "Microsoft 365", "CLOSE-4D", "4-day month-end close", {"Owner": "Finance Manager"}, ["Day 1: bank rules and auto-match", "Day 2: accruals and prepayments", "Day 3: review and adjustments", "Day 4: sign-off"], "Steps"))], "New close process live")],
  "outcome": "About 70% of reconciliations now match automatically, controls are intact, and the close drops from 8 days to a 4-day checklist. Nothing was approved, paid or lodged by an agent."})

# 9 Professional sports
domain("sports", "Professional sports", "#c0392b", ["Sports operations analyst", "Performance BA", "Fan experience analyst"],
 "Stakeholder diversity, scheduling, monetisation, fan expectations", "League policies, privacy, athlete health data, safety",
 "Connects performance, operations and fan value",
 [sor("ticketing", "Ticketing and membership", "Tickets, members, seat maps, renewals", ["Ticketmaster", "Ticketek", "Tixr"], "Partner APIs", BUILD,
      "Read sales and renewal rates", "None", "Change prices or cancel tickets", "read", ["data-analytics"], "Personal, payment"),
  sor("athlete", "Athlete management and performance", "Training loads, wellness, injuries", ["Catapult", "Kitman Labs", "Smartabase"], "Vendor APIs", BUILD,
      "Read aggregated team load trends only", "None", "Read or write individual medical data", "read", ["performance-analysis"], "Health information (athletes)"),
  sor("fancrm", "Fan CRM and marketing", "Fan profiles, segments, campaigns", ["Salesforce", "HubSpot"], "REST APIs", OFF + " (Salesforce, HubSpot)",
      "Read segments and engagement", "Create draft campaigns, with approval", "Send to fans without approval", "destructive", ["digital-marketing", "data-analytics"], "Personal"),
  sor("media", "Media and content", "Video, highlights, rights", ["Brightcove", "Frame.io"], "Vendor APIs", BUILD,
      "Read content metadata", "None", "Publish content", "read", ["digital-marketing"], "Licensed content")],
 {"id": "domain-sports", "name": "Membership renewal drive", "why": "More members renew before the season starts.",
  "trigger": {"user": "Head of Membership", "msg": "Renewals are tracking 8% behind last year. Ideas?"},
  "steps": [step("data-analytics", "BI and reporting", "Find who is not renewing", [("ticketing.query_renewals", "read", "Compare renewal rates by segment", "Family members down 15%; most attended fewer than 4 games", None)], "Families who rarely attend are lapsing"),
            step("business-analysis", "Solution ideation, analysis and design", "Shape the offer", [("confluence.create_page", "write", "Write the renewal offer options", "Options page published", art("Page", "Confluence", "MEM-33", "Family renewal offer options", {"Target": "4,200 lapsing family members"}, ["Flexi 5-game family pack", "Free junior clinic with renewal", "Pay monthly with no fee"], "Options"))], "Flexi pack chosen"),
            step("digital-marketing", "Digital marketing", "Build the campaign", [("fancrm.create_campaign", "write", "Create the family renewal campaign as a draft", "Draft campaign ready", art("Campaign", "Fan CRM", "CMP-2207", "Family flexi pack renewal", {"Audience": "4,200 members", "Channel": "Email and SMS", "Status": "Draft"})), ("fancrm.send_campaign", "destructive", "Send the campaign to members", "Sent to 4,200 members", None)], "Campaign sent")],
  "outcome": "Lapsing family members get a flexi 5-game pack offer. The campaign was built by the agent, but only sent once you approved it."})

# 10 Government and NGOs
domain("government", "Government and NGOs", "#1f4e8c", ["Policy BA", "Service design analyst", "Program analyst"],
 "Bureaucracy, funding constraints, complex stakeholders", "Public sector governance, privacy, procurement, records and archives law, accessibility",
 "Turns policy and service intent into measurable public value",
 [sor("case", "Case management", "Cases, clients, services delivered", ["Salesforce Public Sector", "Dynamics 365", "Pega"], "REST APIs", OFF + " (Salesforce)",
      "Read case volumes and timeliness", "Create workflow configuration in test, with approval", "Make decisions on a person's case", "write", ["business-analysis", "data-analytics"], "Personal (often sensitive)"),
  sor("grants", "Grants management", "Applications, assessments, acquittals", ["SmartyGrants", "Fluxx", "Submittable"], "Vendor APIs", BUILD,
      "Read application volumes and assessment times", "None", "Award or decline grants", "read", ["data-analytics"], "Personal, commercial"),
  sor("records", "Records management", "Official records and retention", ["Content Manager", "Objective ECM"], "Vendor APIs", BUILD,
      "Search records metadata", "File new records, with approval", "Destroy or reclassify records", "write", ["business-analysis"], "Official records"),
  sor("identity", "Digital identity", "Citizen sign-in and verification", ["myID (AU)", "Login.gov (US)"], "OIDC", BUILD,
      "None", "None", "Access identity data", "read", [], "Highly sensitive")],
 {"id": "domain-government", "name": "Simpler grant applications", "why": "Community groups apply for grants in half the time.",
  "trigger": {"user": "Program Director", "msg": "Applicants say our grants form takes 3 hours. Can we fix that?"},
  "steps": [step("data-analytics", "BI and reporting", "Find where people struggle", [("grants.query_applications", "read", "Analyse drop-off and completion times", "38% abandon at the budget section; median 3.1 hours", None)], "The budget section is the problem"),
            step("service-experience-design", "Experience design", "Redesign with applicants", [("miro.create_board", "write", "Run co-design sessions with 10 community groups", "Service blueprint created", art("Blueprint", "Miro", "BRD-grants", "Grant application service blueprint", {"Groups involved": "10"}, ["Replace budget table with guided questions", "Save and return", "Plain-language eligibility check up front"], "Changes"))], "New design agreed"),
            step("business-analysis", "Solution ideation, analysis and design", "Configure the workflow", [("case.configure_workflow_test", "write", "Configure the new assessment workflow in test", "Workflow configured in test", None)], "Workflow ready for UAT"),
            step("business-analysis", "Knowledge management", "Keep the record", [("records.file_record", "write", "File the decision and design as official records", "Records filed", art("Official record", "Records management", "REC-2026-118", "Grant form redesign: decision and design", {"Retention": "Per program records schedule"}))], "Decision on the record")],
  "outcome": "The redesigned form targets the budget section that 38% of applicants abandon. It's configured for testing, and the decision is on the official record. Funding decisions stay with people."})

# 11 Higher education
domain("higher-education", "Higher education", "#5b2d8e", ["Education BA", "Student experience analyst", "Systems analyst"],
 "Legacy platforms, student expectations, funding pressure", "Privacy, accreditation, government reporting, compliance and governance",
 "Improves learning support and institutional effectiveness",
 [sor("sis", "Student information system (SIS)", "Enrolments, results, fees, progression", ["Ellucian Banner", "PeopleSoft Campus Solutions", "TechnologyOne Student"], "Vendor APIs, OneRoster", BUILD,
      "Read enrolment and progression data", "None", "Change enrolments, results or fees", "read", ["data-analytics", "business-analysis"], "Personal (students)"),
  sor("lms", "Learning management system (LMS)", "Courses, activity, submissions, grades", ["Canvas", "Moodle", "D2L Brightspace"], "LTI 1.3, REST", COM + " (Canvas, Moodle)",
      "Read course activity and submissions", "Create course announcements, with approval", "Change grades", "write", ["data-analytics"], "Personal (students)"),
  sor("crm", "Student CRM", "Enquiries, outreach, support cases", ["Salesforce Education Cloud", "Dynamics 365"], "REST APIs", OFF + " (Salesforce)",
      "Read support cases and outreach", "Create outreach tasks, with approval", "Send bulk messages without approval", "write", ["business-analysis", "service-desk"], "Personal"),
  sor("identity", "Identity and access", "Accounts, roles, groups", ["Microsoft Entra ID", "Okta"], "SCIM, OIDC", BUILD,
      "Read group membership counts", "None", "Grant or remove access", "read", ["security-architecture"], "Sensitive")],
 {"id": "domain-higher-education", "name": "Early support for at-risk students", "why": "Students get help before they fail, not after.",
  "trigger": {"user": "Dean of Students", "msg": "First-year attrition is 18%. Can we spot students who need help earlier?"},
  "steps": [step("data-governance", "Data quality management", "Agree what data can be used", [("confluence.create_page", "write", "Record the approved data use and privacy conditions", "Data use agreement published", art("Page", "Confluence", "GOV-71", "Student success data: approved use", {"Approved by": "Privacy officer"}, ["Use LMS activity and enrolment data only", "Purpose: offering support, never penalties", "Students can opt out"], "Conditions"))], "Data use approved"),
            step("data-analytics", "BI and reporting", "Find early signals", [("lms.get_activity", "read", "Analyse first 4 weeks of LMS activity", "No login in 10 days predicts 64% of withdrawals", None), ("sis.query_progression", "read", "Link to progression outcomes", "Signal confirmed across 3 intakes", None)], "A reliable early signal"),
            step("business-analysis", "Solution ideation, analysis and design", "Design the outreach", [("crm.create_outreach_tasks", "write", "Create advisor outreach tasks for this week's flagged students", "212 outreach tasks created", art("Task batch", "Student CRM", "OUT-W5", "Week 5 advisor outreach", {"Students": "212", "Owner": "Student advisors"}))], "Advisors have their lists"),
            step("change-management", "Organisational change", "Support the advisors", [("m365.create_document", "write", "Write the advisor playbook", "Playbook published", None)], "Advisors trained")],
  "outcome": "A simple signal (no LMS login for 10 days) flags students early. Advisors have 212 outreach tasks and a playbook, under an approved, opt-out data agreement. No grades or enrolments were touched."})

# 12 Law enforcement
domain("law-enforcement", "Law enforcement", "#22313f", ["Intelligence BA", "Operational analyst", "Systems and process analyst"],
 "Data sharing, security, operational complexity", "Privacy, evidence handling, public accountability, security controls (for example CJIS in the US)",
 "Strengthens decisions, operations and public safety outcomes",
 [sor("cad", "Computer-aided dispatch (CAD)", "Calls for service, units, response times", ["Hexagon", "Motorola PremierOne", "Mark43 CAD"], "Vendor APIs, approved extracts", BUILD + " (approved extracts only)",
      "Read de-identified response-time extracts", "None", "Create, change or dispatch incidents", "read", ["data-analytics", "performance-analysis"], "Restricted operational"),
  sor("rms", "Records management (RMS)", "Occurrences, persons, property, cases", ["Niche RMS", "Mark43 RMS"], "Vendor APIs", BUILD + " (approved extracts only)",
      "Read aggregated statistics only", "None", "Read or write individual records", "read", ["data-analytics"], "Highly restricted"),
  sor("evidence", "Digital evidence management", "Body-worn video, exhibits, chain of custody", ["Axon Evidence", "Genetec Clearance"], "Vendor APIs", BUILD,
      "None", "None", "Access, change or share evidence", "read", [], "Evidence (chain of custody)"),
  sor("intel", "Intelligence analysis", "Links, networks, intelligence reports", ["i2 Analyst's Notebook", "Palantir"], "Vendor APIs", BUILD,
      "None", "None", "Any access by agents", "read", [], "Classified")],
 {"id": "domain-law-enforcement", "name": "Faster response insight", "why": "Leaders see where response times slip, using approved data only.",
  "trigger": {"user": "Superintendent, Operations", "msg": "Priority 1 response times are slipping on weekends. Why?"},
  "steps": [step("data-analytics", "BI and reporting", "Analyse approved data", [("cad.read_extract", "read", "Analyse the de-identified response-time extract", "Weekend P1 times +3.5 minutes, between 10pm and 2am", None)], "The slippage is late weekend nights"),
            step("performance-analysis", "IT performance management", "Find the drivers", [("cad.read_extract", "read", "Compare unit availability by shift", "Unit availability drops 22% at shift changeover at 11pm", None)], "Shift changeover gap"),
            step("business-analysis", "Solution ideation, analysis and design", "Model the options", [("confluence.create_page", "write", "Model rostering options for the changeover", "Options paper published", art("Page", "Confluence", "OPS-LE-14", "Weekend changeover options", {"Data": "De-identified extract only"}, ["Stagger changeover by 30 minutes", "Hold 2 units over during changeover", "Move changeover to 9pm on weekends"], "Options"))], "Options ready for command"),
            step("change-management", "Organisational change", "Plan the trial", [("m365.create_document", "write", "Draft the trial plan and union consultation notes", "Trial plan drafted", None)], "Trial ready for decision")],
  "outcome": "Weekend P1 slippage comes from the 11pm shift changeover. Rostering options and a trial plan are ready for command. Agents used only de-identified extracts, and never touched records, evidence or dispatch."})


# Depth pass: richer fields and sections for every scenario artefact, merged by artefact id.
ENRICH = {
 "DA-118": {"fields": {"Space": "Digital Assets", "Status": "Draft for legal review", "Owner": "Business analysis agent", "Reviewers": "Legal, Compliance, Risk"},
  "sections": [sec("Purpose", text="Define who may hold, transfer and redeem tokenised invoice units, and the compliance controls built into the contract."),
   sec("Business rules", items=["Only KYC-verified wholesale investors may hold units", "Transfers over $1,000 carry travel-rule data", "Redemption at invoice maturity, T+2 settlement", "Issuer can pause transfers under a 2-of-3 multisig", "Monthly reserve attestation published on-chain"]),
   sec("Compliance mapping", table=[["Requirement", "Source"], ["Holder verification", "AML/CTF Act"], ["Travel-rule data on transfers", "FATF R.16"], ["Reserve attestation", "Internal policy"], ["Freeze function", "Risk committee"]]),
   sec("Open questions", items=["Secondary transfers between verified holders: allowed at launch?", "Treatment of defaulted invoices in the redemption queue"])]},
 "0x7a\u2026c21": {"fields": {"Network": "Test network", "Compiler": "solc 0.8.26", "Standard": "ERC-20 with transfer restrictions", "Deploy gas": "1.84M", "Audit": "Booked for next sprint", "Owner": "Multisig (2 of 3)"},
  "sections": [sec("Deployment log", items=["14:02 Compiled 4 contracts, 0 warnings", "14:03 Deployed InvoiceToken v0.3", "14:03 Allowlist seeded with 11 verified wallets", "14:04 Pause and freeze functions verified"]),
   sec("Restrictions in code", items=["transfer() reverts unless both parties are on the allowlist", "pause() restricted to the multisig", "redeem() only after maturity timestamp"])]},
 "LEND-77": {"fields": {"Project": "LEND", "Priority": "High", "Compliance reviewer": "Assigned", "Target": "Next quarter", "Stories": "5"},
  "sections": [sec("Stories", items=["LEND-78 Remind me 2 days before a repayment is due", "LEND-79 Let me move my repayment date to payday, once per term", "LEND-80 Respect my contact preferences and quiet hours", "LEND-81 Suppress all reminders for hardship-flagged accounts", "LEND-82 Measure missed-payment rate per cohort"]),
   sec("Acceptance criteria", items=["No reminder sent to any account with a hardship flag", "Date moves re-amortise without extra fees", "Opt-out honoured within 24 hours"]),
   sec("Out of scope", items=["Collections messaging", "New credit assessments"])]},
 "we_test_41": {"fields": {"Mode": "Test", "Events": "invoice.upcoming", "Endpoint": "https://api.lender.example/muster/payments", "Signing secret": "whsec_\u2022\u2022\u2022\u2022", "API version": "2026-01-15"},
  "sections": [sec("Recent test deliveries", table=[["Event", "Response", "Time"], ["invoice.upcoming", "200 OK", "09:14"], ["invoice.upcoming", "200 OK", "09:02"], ["invoice.upcoming", "200 OK", "08:47"]])]},
 "PROD-301": {"fields": {"Project": "PROD", "Flag": "ai-search", "Owner": "Product management agent", "Success measure": "Search success +10%", "Guardrail": "Error rate under 0.5%"},
  "sections": [sec("Rollout plan", table=[["Stage", "Users", "Gate to proceed"], ["Internal", "1%", "No crashes for 48h"], ["Early", "10%", "Errors under 0.5%"], ["Half", "50%", "Search success +10%"], ["Everyone", "100%", "Product sign-off"]]),
   sec("Stories", items=["PROD-302 Natural-language search behind the ai-search flag", "PROD-303 Fallback to keyword search on timeout", "PROD-304 Per-stage analytics dashboard", "PROD-305 Kill switch wired to on-call"])]},
 "PR #880": {"fields": {"Branch": "feature/ai-search \u2192 main", "Files changed": "17", "Lines": "+1,204 \u2212310", "Checks": "All passing", "Reviewers": "2 approvals", "Labels": "feature-flag, search"},
  "sections": [sec("Changes", items=["search/AiSearch.ts: query pipeline behind the ai-search flag", "search/fallback.ts: keyword fallback on 2s timeout", "flags.ts: register ai-search, default off", "analytics: stage-tagged events", "tests: 42 new cases, flag on and off"]),
   sec("Test plan", items=["Unit and integration suites green", "Load test at 2x peak with flag on", "Accessibility pass on results view"])]},
 "ai-search": {"fields": {"Environment": "Production", "Before": "0%", "After": "10%", "Rule": "10% by user-id hash", "Approved by": "You", "Change ref": "FL-2291"},
  "sections": [sec("History", table=[["When", "Change", "By"], ["Today 14:02", "0% \u2192 10%", "Muster, approved by you"], ["Yesterday", "Flag created, default off", "Platform engineer agent"]]),
   sec("Kill switch", text="Setting the flag to 0% takes effect within 30 seconds; on-call has the runbook.")]},
 "BRD-discharge": {"fields": {"Workshops": "2 wards", "Participants": "14 staff (nursing, pharmacy, allied health)", "Facilitator": "Service experience design agent", "Pain points": "7"},
  "sections": [sec("Pain points from the wards", items=["Medication charts finalised late morning", "Transport booked on the day, not the day before", "Families not told the discharge plan", "Pharmacy queue peaks 10am\u20131pm", "Paperwork waits for one consultant round", "No visibility of bed demand downstream"]),
   sec("What already works", items=["Criteria-led discharge on 4 East pilot", "Weekend discharge checklist"])]},
 "HLTH-52": {"fields": {"Space": "Health improvement", "Status": "For clinical review", "Clinical sign-off": "Required", "Reviewers": "Director of Medical Services, NUM 4 West"},
  "sections": [sec("Problem", text="61% of discharges happen after 11am. The longest wait is pharmacy: medications are requested on the morning of discharge."),
   sec("Options", table=[["Option", "Effort", "Bed-hours saved/day"], ["Medication review the day before", "Low", "9"], ["Criteria-led discharge, low-risk patients", "Medium", "14"], ["Discharge lounge open from 9am", "Medium", "11"]]),
   sec("Risks", items=["Criteria-led discharge needs clear escalation rules", "Lounge staffing on weekends", "Pharmacy workload shifts to afternoons"]),
   sec("Recommendation", text="Pilot options 1 and 2 on one ward for 4 weeks, measured on before-11am discharge rate.")]},
 "OPS-209": {"fields": {"Space": "Operations", "Status": "Agreed with the depot manager", "Saving": "About 35 minutes per load", "Evidence": "90 days of TMS and telematics data", "Owner": "Business analysis agent"},
  "sections": [sec("Current state", items=["Loads staged after 2pm compete for one dock crew", "North cut-off at 3:30pm pushes departures into the peak", "Average dwell at Depot 4: 48 minutes", "3 routes carry 71% of the late deliveries"]),
   sec("Future state", items=["Pre-stage north loads by 1pm", "Move the north cut-off to 12:30", "Dock scheduling by route, published the day before", "Second dock crew 12\u20133pm on Mon/Thu peaks"]),
   sec("Expected impact", table=[["Measure", "Now", "Expected"], ["Depot 4 dwell", "48 min", "15 min"], ["North on-time delivery", "87%", "95%+"], ["Driver overtime", "6.2 h/week", "2 h/week"]]),
   sec("Decision needed", text="Approve the 12:30 cut-off with the three affected customers before the TMS change is promoted.")]},
 "RULE-N12": {"fields": {"Environment": "Test", "Rule set": "North region v12", "Routes": "3", "Rollback": "Revert to v11 (one click)", "Promotion": "CHG0041, Monday"},
  "sections": [sec("Rule changes", items=["Cut-off for north routes: 15:30 \u2192 12:30", "Pre-stage flag required before tender", "Dock windows assigned per route"]),
   sec("Validation", items=["Replayed the last 30 days in test: simulated on-time 94.6%", "No orders orphaned by the earlier cut-off"])]},
 "FIG-claims": {"fields": {"Frames": "12", "Flows": "Lodge, track, upload photos", "Tested with": "8 customers, moderated", "Median time": "6 minutes", "Completion": "7 of 8 unaided"},
  "sections": [sec("Findings", items=["Registration lookup confused 2 users: added a helper and example", "Photo guidance cut retakes by half", "Plain-language excess explainer improved trust", "Progress indicator reduced abandonment in testing"]),
   sec("Next", items=["Test the declined-cover path", "Accessibility review with a screen-reader user"])]},
 "CLM-140": {"fields": {"Project": "CLM", "Stories": "9", "Fraud checks": "Scored before acceptance", "Target": "Release 3", "Dependencies": "Claims API v2"},
  "sections": [sec("Stories", items=["CLM-141 Lodge a motor claim online in under 10 minutes", "CLM-142 Upload damage photos from a phone", "CLM-143 See repairer options by postcode", "CLM-144 Track claim status without calling", "CLM-145 Fraud score runs before acceptance", "CLM-146 Hand off complex claims to a consultant with context"]),
   sec("Non-functional", items=["Photo upload to 10MB, resumable", "WCAG 2.2 AA", "Fraud scoring under 500ms", "Works on 3G connections"])]},
 "VW_OPEX_VAR": {"fields": {"Schema": "Sandbox", "Rows": "142", "Grain": "Cost centre \u00d7 month", "Sources": "ERP GL actuals, EPM forecast", "Refreshed": "Today 07:00"},
  "sections": [sec("Definition", items=["actual_amount \u2212 forecast_amount AS variance", "variance / forecast_amount AS variance_pct", "Joined on cost_centre and period", "Excludes capitalised project codes"]),
   sec("Quality checks", items=["Row counts match GL control totals", "No unmapped cost centres this month"])]},
 "FIN-VAR-10": {"fields": {"Period": "October", "Variance": "+6% ($820k)", "Prepared for": "CFO", "Status": "Draft", "Data quality": "All checks passing"},
  "sections": [sec("Summary", text="October operating costs are $820k (6%) over forecast. Two drivers explain 80% of the gap; both are known and manageable."),
   sec("Drivers", items=["Cloud spend +$410k: new analytics workloads, growth 14% vs 3% assumed", "Contractors +$260k: delayed permanent hiring", "Other +$150k: spread across 40 cost centres, no pattern"]),
   sec("Actions", table=[["Action", "Owner", "Due"], ["Reforecast cloud at 14% growth", "FP&A", "Friday"], ["Contractor ramp-down plan", "CTO office", "Next sprint"], ["Re-tag analytics workloads for showback", "Platform team", "Month-end"]])]},
 "RULES-6": {"fields": {"Rules": "6", "Expected auto-match": "About 870 lines a month", "Control": "Match only; approvals unchanged", "Created by": "Business analysis agent, approved by you"},
  "sections": [sec("Rules", table=[["Rule", "Supplier", "Matches on"], ["R1", "CloudCo", "Memo contains CLOUDCO, amount \u00b12%"], ["R2", "FreightCo", "Reference starts FR-"], ["R3", "OfficeHub", "Exact amount, weekly"], ["R4", "Insurer", "Policy number in memo"], ["R5", "Utilities", "Account number match"], ["R6", "Telco", "Account number match"]]),
   sec("Controls kept", items=["Rules suggest matches; a person still reconciles", "No rule touches payments or approvals", "Audit trail records every auto-match"])]},
 "CLOSE-4D": {"fields": {"Owner": "Finance Manager", "Effective": "Next month-end", "Previous close": "8 days", "Target": "4 days"},
  "sections": [sec("Steps", items=["Day 1: bank rules and auto-match, exceptions worked", "Day 2: accruals, prepayments, intercompany", "Day 3: review, adjustments, variance notes", "Day 4: sign-off and reporting pack"]),
   sec("Sign-offs", items=["Reconciliations: senior accountant", "Journals over $50k: Financial Controller", "Final pack: CFO"])]},
 "MEM-33": {"fields": {"Space": "Membership", "Status": "Option chosen: flexi pack", "Target": "4,200 lapsing family members", "Decision": "Head of Membership"},
  "sections": [sec("Why family members lapse", items=["Attended fewer than 4 games last season", "Fixture clashes with junior sport", "Cost per use feels high for partial attendance"]),
   sec("Options", table=[["Option", "Cost to club", "Modelled uptake"], ["Flexi 5-game family pack", "Low", "31%"], ["Free junior clinic with renewal", "Medium", "18%"], ["Monthly payments, no fee", "Low", "24%"]]),
   sec("Decision", text="Run the flexi pack as the lead offer, with monthly payments available at checkout.")]},
 "CMP-2207": {"fields": {"Audience": "4,200 members", "Channel": "Email, then SMS to non-openers", "Offer": "Flexi 5-game family pack", "Send": "Tuesday 10am", "Exclusions": "Hardship flags, unsubscribed, renewed", "Status": "Draft"},
  "sections": [sec("Message preview", text="Hi {first_name}, you were there for the big ones last season. This year, pick your 5: one family pass, any 5 home games, junior clinic included."),
   sec("Journey", items=["Day 0: email to all 4,200", "Day 3: SMS to non-openers", "Day 10: call list of high-tenure members to the service team"]),
   sec("Measurement", items=["Target: 31% uptake (1,300 renewals)", "Holdout group of 400 to measure true lift"])]},
 "BRD-grants": {"fields": {"Sessions": "3 co-design workshops", "Participants": "10 community groups", "Facilitator": "Service experience design agent"},
  "sections": [sec("Changes agreed", items=["Replace the budget table with guided questions", "Save and return at any step", "Plain-language eligibility check up front", "Reuse documents from previous applications", "Autosave with visible confirmation", "Status tracker after submission"])]},
 "REC-2026-118": {"fields": {"Classification": "Program records", "Retention": "7 years after program close", "Access": "Program team", "Filed by": "Business analysis agent, approved by you"},
  "sections": [sec("Contents", items=["Decision memo: form redesign approved", "Service blueprint export", "Co-design consultation notes (10 groups)", "Privacy assessment for the guided budget questions"])]},
 "GOV-71": {"fields": {"Approved by": "Privacy officer", "Review": "Each semester", "Status": "Approved", "Opt-out": "Available to all students"},
  "sections": [sec("Conditions", items=["Use LMS activity and enrolment data only", "Purpose: offering support, never penalties or progression decisions", "Advisors see a flag and a reason, never raw activity logs", "No individual-level data leaves the SIS or LMS", "Students can opt out; opt-outs reviewed weekly"]),
   sec("Data used", table=[["Source", "Fields", "Purpose"], ["LMS", "Last login, submissions", "Early-support flag"], ["SIS", "Enrolment status, study load", "Context for advisors"]])]},
 "OUT-W5": {"fields": {"Students": "212", "Owner": "Student advisors", "Due": "Friday", "Script": "Supportive check-in v2", "Opt-outs excluded": "Yes"},
  "sections": [sec("Breakdown", table=[["Faculty", "Students"], ["Business", "61"], ["Engineering", "54"], ["Arts", "49"], ["Science", "48"]]),
   sec("Task template", items=["Reason for flag, in plain words", "Suggested opener: check in, don't check up", "Links: study support, counselling, financial help", "Outcome field feeds next week's review"])]},
 "OPS-LE-14": {"fields": {"Space": "Operations", "Data": "De-identified extract only", "Status": "For command review", "Author": "Business analysis agent"},
  "sections": [sec("Finding", text="Weekend P1 response times slip by 3.5 minutes between 10pm and 2am. Unit availability drops 22% during the 11pm shift changeover."),
   sec("Options", table=[["Option", "Coverage gain at 23:00", "Cost"], ["Stagger changeover by 30 min", "+18%", "Nil"], ["Hold 2 units through changeover", "+9%", "Overtime"], ["Move weekend changeover to 9pm", "+15%", "Roster change"]]),
   sec("Consultation needed", items=["Workforce representatives on roster options", "WHS review of extended shifts", "4-week trial with weekly response-time review"])]},
}

def apply_enrichment():
    for d in D:
        for st in d["scenario"]["steps"]:
            for a in st["actions"]:
                art_ = a.get("artefact")
                if art_ and art_["id"] in ENRICH:
                    e = ENRICH[art_["id"]]
                    art_["fields"] = {**art_.get("fields", {}), **e.get("fields", {})}
                    if "sections" in e: art_["sections"] = e["sections"]

def main():
    apply_enrichment()
    ids = {re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", r["role"].replace(" practitioners", "").lower())) for r in json.loads((ROOT / "data/roles.json").read_text())}
    caps = {c["name"] for cat in json.loads((ROOT / "data/capability-map.json").read_text())["categories"] for s in cat["subcategories"] for c in s["capabilities"]}
    for d in D:
        for s in d["systemsOfRecord"]:
            for a in s["agents"]: assert a in ids, (d["id"], a)
        for st in d["scenario"]["steps"]:
            assert st["agent"] in ids, (d["id"], st["agent"]); assert st["capability"] in caps, (d["id"], st["capability"])
    for p in PRACTICES:
        for a in p["agents"]: assert a in ids, a
    out = {"_doc": "Domain packs: systems of record per industry, how agents may interact with each, and a runnable scenario. maxRisk caps what any agent may do on that system, whatever its SFIA level.",
           "practices": PRACTICES, "domains": D}
    (ROOT / "data/domains.json").write_text(json.dumps(out, indent=1))
    print(f"{len(D)} domains, {sum(len(d['systemsOfRecord']) for d in D)} systems of record")

if __name__ == "__main__":
    main()
