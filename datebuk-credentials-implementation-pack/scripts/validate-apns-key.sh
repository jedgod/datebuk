#!/usr/bin/env bash
set -euo pipefail
F="${1:?Usage: validate-apns-key.sh path/to/AuthKey.p8}"
[[ -f "$F" ]] || { echo "Missing file"; exit 1; }
grep -q "BEGIN PRIVATE KEY" "$F" || { echo "Invalid APNs key format"; exit 1; }
echo "APNs key structure appears valid."
