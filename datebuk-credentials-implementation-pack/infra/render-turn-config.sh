#!/usr/bin/env bash
set -euo pipefail
set -a; source "${1:-.env.production}"; set +a
mkdir -p infra/coturn
envsubst < infra/coturn/turnserver.conf.template > infra/coturn/turnserver.conf
chmod 600 infra/coturn/turnserver.conf
echo "Rendered infra/coturn/turnserver.conf"
