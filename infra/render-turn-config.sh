#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${1:-.env.production}"
OUTPUT_FILE="${2:-infra/coturn/turnserver.conf}"
set -a; source "$ENV_FILE"; set +a
if [[ -n "${TURN_SHARED_SECRET_FILE:-}" ]]; then TURN_SHARED_SECRET="$(tr -d '\r\n' < "$TURN_SHARED_SECRET_FILE")"; fi
: "${TURN_DOMAIN:?TURN_DOMAIN is required}"
: "${TURN_SHARED_SECRET:?TURN_SHARED_SECRET or TURN_SHARED_SECRET_FILE is required}"
mkdir -p "$(dirname "$OUTPUT_FILE")"
envsubst < infra/coturn/turnserver.conf.template > "$OUTPUT_FILE"
chmod 600 "$OUTPUT_FILE"
echo "Rendered $OUTPUT_FILE"
