#!/usr/bin/env bash
set -euo pipefail

API="${API_URL:-http://localhost:5052}"
TOKEN="${ACCESS_TOKEN:?Set ACCESS_TOKEN}"

curl -fsS "${API}/api/health"
echo

curl -fsS \
  -H "Authorization: Bearer ${TOKEN}" \
  "${API}/api/turn-credentials"
echo
