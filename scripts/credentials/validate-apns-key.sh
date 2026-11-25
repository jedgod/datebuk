#!/usr/bin/env bash
set -euo pipefail
KEY_FILE="${1:?Usage: validate-apns-key.sh path/to/AuthKey.p8}"
[[ -f "$KEY_FILE" ]] || { echo "APNs key file is missing"; exit 1; }
grep -q "BEGIN PRIVATE KEY" "$KEY_FILE" || { echo "Invalid APNs key format"; exit 1; }
openssl pkey -in "$KEY_FILE" -noout -check >/dev/null
echo "APNs authentication key structure is valid."
