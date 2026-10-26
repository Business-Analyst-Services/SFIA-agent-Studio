#!/usr/bin/env python3
"""Fidelity pass over artefacts in value-streams.json and domains.json:
AI-governance labels, approval stamps at gates, and REQ registers on epics —
matching the BAS practice-deliverable templates (REQ IDs, MoSCoW, acceptance)."""
import json,re

MOSCOW=['Must','Must','Should','Should','Could','Could','Won’t (this phase)']

def label_for(a):
    appr=str(a.get('fields',{}).get('Approval','')+a.get('fields',{}).get('Status',''))
    ok=bool(re.search(r'approved|granted|signed',appr,re.I))
    return 'ai-generated · ba-approved' if ok else 'ai-generated'

def enrich(a):
    f=a.setdefault('fields',{})
    f.setdefault('Labels',label_for(a))
    secs=a.setdefault('sections',[])
    # approval stamp where a gate was passed
    appr=str(f.get('Approval',''))
    if re.search(r'granted|approved',appr,re.I) and not any('stamp' in s for s in secs):
        secs.append({'h':'Gate','stamp':{'by':'you, at the gate in the conversation','note':'label ba-approved added · AI Run Count reset to 0'}})
    # epics: structure scope/requirement lists as a REQ register; story lists as a story table
    if a.get('kind','').lower() in ('epic','discovery epic'):
        for s in secs:
            items=s.get('items')
            if not items or 'reqs' in s or 'table' in s: continue
            h=s.get('h','')
            if re.search(r'stor',h,re.I):
                rows=[['Story','Summary','Acceptance']]
                for it in items:
                    m=re.match(r'([A-Z]{2,}-\d+)\s+(.*)',it)
                    rows.append([m.group(1).replace('-','\u2011'),m.group(2),'Gherkin drafted for review'] if m else ['—',it,'Gherkin drafted for review'])
                s.pop('items');s['table']=rows;s['h']=h+' (AI-drafted, BA to refine)'
            elif re.search(r'scope|requirement',h,re.I):
                s['reqs']=[{'id':'REQ-%03d'%(i+1),'m':MOSCOW[i%len(MOSCOW)],'text':it,
                            'accept':'Testable — acceptance note drafted for review'}
                           for i,it in enumerate(s.pop('items'))]
    return a

def walk(o,n=[0]):
    if isinstance(o,dict):
        if 'artefact' in o and isinstance(o['artefact'],dict):
            enrich(o['artefact']);n[0]+=1
        for v in o.values():walk(v,n)
    elif isinstance(o,list):
        for v in o:walk(v,n)
    return n[0]

for path in ('data/value-streams.json','data/domains.json'):
    d=json.load(open(path))
    k=walk(d,[0])
    json.dump(d,open(path,'w'),ensure_ascii=False,indent=1)
    print(path,k,'artefacts enriched')
