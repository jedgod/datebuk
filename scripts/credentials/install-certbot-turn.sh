#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo"; exit 1; }
: "${TURN_DOMAIN:?Set TURN_DOMAIN}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL}"
apt-get update
apt-get install -y certbot
certbot certonly --standalone --non-interactive --agree-tos --email "$CERTBOT_EMAIL" -d "$TURN_DOMAIN"
install -m 755 "$(dirname "$0")/../../infra/certbot/deploy-turn-cert.sh" /etc/letsencrypt/renewal-hooks/deploy/datebuk-turn
certbot renew --dry-run
echo "TURN certificate and automatic renewal hook installed."
