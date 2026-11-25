#!/usr/bin/env bash
set -euo pipefail
mkdir -p secrets/runtime secrets/turn secrets/postgres
umask 077
openssl rand -hex 48 > secrets/runtime/jwt-secret.txt
openssl rand -hex 48 > secrets/runtime/refresh-token-pepper.txt
openssl rand -hex 48 > secrets/turn/shared-secret.txt
openssl rand -hex 32 > secrets/postgres/password.txt
echo "Generated protected runtime secret files. Do not commit or copy them into logs."
