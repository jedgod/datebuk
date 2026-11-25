#!/usr/bin/env python3
import argparse,base64,hashlib,hmac,time
p=argparse.ArgumentParser();p.add_argument('--secret',required=True);p.add_argument('--user',required=True);p.add_argument('--ttl',type=int,default=600);a=p.parse_args()
exp=int(time.time())+a.ttl; username=f"{exp}:{a.user}"
cred=base64.b64encode(hmac.new(a.secret.encode(),username.encode(),hashlib.sha1).digest()).decode()
print(f"username={username}");print(f"credential={cred}");print(f"expires_at={exp}")
