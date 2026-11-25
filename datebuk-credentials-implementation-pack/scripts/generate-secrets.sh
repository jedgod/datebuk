#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${1:-.env.production}"
[[ -f "$ENV_FILE" ]] || cp .env.production.example "$ENV_FILE"
replace(){ local k="$1" v="$2"; python3 - "$ENV_FILE" "$k" "$v" <<'PY2'
from pathlib import Path
import sys
p=Path(sys.argv[1]); k=sys.argv[2]; v=sys.argv[3]
lines=p.read_text().splitlines(); out=[]; found=False
for line in lines:
    if line.startswith(k+'='): out.append(k+'='+v); found=True
    else: out.append(line)
if not found: out.append(k+'='+v)
p.write_text('
'.join(out)+'
')
PY2
}
replace JWT_SECRET "$(openssl rand -hex 48)"
replace COOKIE_SECRET "$(openssl rand -hex 48)"
replace TURN_SHARED_SECRET "$(openssl rand -hex 48)"
chmod 600 "$ENV_FILE"
echo "Generated secure JWT, cookie, and TURN secrets in $ENV_FILE"
