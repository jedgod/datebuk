#!/usr/bin/env bash
set -euo pipefail
if command -v docker >/dev/null 2>&1; then
  docker compose -f "${DATEBUK_COMPOSE_FILE:-docker-compose.production.yml}" restart coturn
else
  systemctl restart coturn
fi
