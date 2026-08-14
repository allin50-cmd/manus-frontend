#!/usr/bin/env python3
import json, os, sys, urllib.request
from pathlib import Path

BASE=(os.getenv('MANUS_BASE_URL') or 'https://fineguard-ii4yhj27.manus.space').rstrip('/')
OUT=Path(sys.argv[1] if len(sys.argv)>1 else 'tools/compute/manus-portfolio.json')
TIMEOUT=float(os.getenv('MANUS_TIMEOUT','20'))
HEADERS={'Accept':'application/json','User-Agent':'UltraCore-Manus-Export/1.0'}
if os.getenv('MANUS_AUTH_HEADER'): HEADERS['Authorization']=os.environ['MANUS_AUTH_HEADER']
if os.getenv('MANUS_COOKIE'): HEADERS['Cookie']=os.environ['MANUS_COOKIE']

CANDIDATES={
 'properties':['/api/properties','/api/la/properties','/api/property/properties'],
 'tenancies':['/api/tenancies','/api/la/tenancies'],
 'certificates':['/api/certificates','/api/compliance','/api/la/compliance','/api/property/certificates'],
 'maintenance':['/api/maintenance','/api/la/maintenance','/api/property/maintenance'],
}

def get_json(path):
    req=urllib.request.Request(BASE+path,headers=HEADERS)
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r:
        ct=(r.headers.get('content-type') or '').lower()
        body=r.read()
        if 'json' not in ct:
            raise RuntimeError(f'{path}: expected JSON, got {ct or "unknown"}')
        return json.loads(body.decode('utf-8'))

def rows(obj):
    if isinstance(obj,list): return obj
    if not isinstance(obj,dict): return None
    for key in ('data','items','results','rows','properties','tenancies','certificates','maintenance','jobs'):
        if isinstance(obj.get(key),list): return obj[key]
    return None

def discover(name):
    errors=[]
    for path in CANDIDATES[name]:
        try:
            obj=get_json(path); rs=rows(obj)
            if rs is not None:
                return path,rs
            errors.append(f'{path}: JSON without list payload')
        except Exception as e: errors.append(str(e))
    raise RuntimeError(f'No usable {name} endpoint. ' + ' | '.join(errors))

def sid(r): return str(r.get('sourceId') or r.get('source_id') or r.get('id') or r.get('_id') or '')
def propid(r): return str(r.get('propertySourceId') or r.get('property_source_id') or r.get('propertyId') or r.get('property_id') or r.get('property',{}).get('id') if isinstance(r.get('property'),dict) else '')
def money_pence(r,*keys):
    for k in keys:
        v=r.get(k)
        if v is None: continue
        if isinstance(v,int): return v if 'Pence' in k or 'pence' in k else v*100
        try: return round(float(str(v).replace('£','').replace(',',''))*100)
        except: pass
    return 0

def normalise(name,rs):
    out=[]
    for r in rs:
        if not isinstance(r,dict): continue
        if name=='properties':
            address=r.get('address') if isinstance(r.get('address'),dict) else {}
            out.append({'sourceId':sid(r),'addressLine1':r.get('addressLine1') or r.get('address_line1') or address.get('line1') or r.get('address') if isinstance(r.get('address'),str) else '',
                        'addressLine2':r.get('addressLine2') or r.get('address_line2') or address.get('line2'),'city':r.get('city') or address.get('city'),
                        'postcode':r.get('postcode') or r.get('post_code') or address.get('postcode') or '','propertyType':r.get('propertyType') or r.get('property_type'),
                        'bedrooms':r.get('bedrooms'),'status':r.get('status') or 'Active'})
        elif name=='tenancies':
            out.append({'sourceId':sid(r),'propertySourceId':propid(r),'tenantName':r.get('tenantName') or r.get('tenant_name') or r.get('name'),
                        'tenantEmail':r.get('tenantEmail') or r.get('tenant_email') or r.get('email'),'tenantPhone':r.get('tenantPhone') or r.get('tenant_phone') or r.get('phone'),
                        'startDate':r.get('startDate') or r.get('start_date'),'endDate':r.get('endDate') or r.get('end_date'),
                        'monthlyRentPence':money_pence(r,'monthlyRentPence','monthly_rent_pence','monthlyRent','monthly_rent','rent'),'status':r.get('status') or 'Active'})
        elif name=='certificates':
            out.append({'sourceId':sid(r),'propertySourceId':propid(r),'certificateType':r.get('certificateType') or r.get('certificate_type') or r.get('type') or r.get('name'),
                        'referenceNumber':r.get('referenceNumber') or r.get('reference_number') or r.get('reference'),'issuedAt':r.get('issuedAt') or r.get('issued_at') or r.get('issueDate'),
                        'expiresAt':r.get('expiresAt') or r.get('expires_at') or r.get('expiryDate') or r.get('expiry_date'),'status':r.get('status') or 'Valid'})
        else:
            out.append({'sourceId':sid(r),'propertySourceId':propid(r),'title':r.get('title') or r.get('summary') or r.get('issue') or 'Maintenance job',
                        'description':r.get('description') or r.get('notes'),'priority':r.get('priority') or 'Medium','status':r.get('status') or 'Open',
                        'dueAt':r.get('dueAt') or r.get('due_at') or r.get('dueDate'),'assignedTo':r.get('assignedTo') or r.get('assigned_to') or r.get('assignee')})
    return out

def main():
    payload={}; endpoints={}
    for name in CANDIDATES:
        path,rs=discover(name); endpoints[name]=path; payload[name]=normalise(name,rs)
    for name,rs in payload.items():
        missing=[i for i,r in enumerate(rs) if not r.get('sourceId')]
        if missing: raise RuntimeError(f'{name}: {len(missing)} records missing stable source id')
    payload['_source']={'baseUrl':BASE,'endpoints':endpoints}
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False))
    print(json.dumps({'output':str(OUT),'endpoints':endpoints,'counts':{k:len(payload[k]) for k in CANDIDATES}},indent=2))

if __name__=='__main__': main()
