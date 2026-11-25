#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1]; E=R/'.env.production'
vals={}
if E.exists():
  for x in E.read_text().splitlines():
    if x and not x.startswith('#') and '=' in x:
      k,v=x.split('=',1); vals[k]=v
errs=[]; warns=[]
for k in ['API_DOMAIN','TURN_DOMAIN','JWT_SECRET','COOKIE_SECRET','APNS_KEY_ID','APNS_TEAM_ID','APNS_BUNDLE_ID','TURN_SHARED_SECRET','ANDROID_KEY_ALIAS']:
  if vals.get(k,'') in ('','GENERATE_ME','CHANGE_ME','XXXXXXXXXX','SUPPLY_SECURELY'): errs.append(f'{k} missing or placeholder')
for k in ['JWT_SECRET','COOKIE_SECRET','TURN_SHARED_SECRET']:
  if vals.get(k) and len(vals[k])<48: errs.append(f'{k} is too short')
if not list((R/'secrets/apple').glob('*.p8')): errs.append('APNs .p8 key missing in secrets/apple')
fp=R/'secrets/firebase/firebase-service-account.json'
if not fp.exists(): errs.append('Firebase service account missing')
else:
  try:
    d=json.loads(fp.read_text())
    for f in ['project_id','private_key','client_email']:
      if not d.get(f): errs.append(f'Firebase JSON missing {f}')
  except Exception: errs.append('Firebase service account JSON invalid')
gs=R/'apps/mobile/android/app/google-services.json'
if not gs.exists(): errs.append('google-services.json missing')
ks=R/'secrets/android/datebuk-release.keystore'
if not ks.exists(): errs.append('Android release keystore missing')
for w in warns: print('WARNING:',w)
for e in errs: print('ERROR:',e)
if errs: print(f'FAILED with {len(errs)} error(s)'); sys.exit(1)
print('PASSED: required credential files and values are present')
