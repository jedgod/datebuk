#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo"; exit 1; }
DOMAIN="${TURN_DOMAIN:?Set TURN_DOMAIN}"; EMAIL="${CERTBOT_EMAIL:?Set CERTBOT_EMAIL}"
apt-get update && apt-get install -y certbot
systemctl stop coturn 2>/dev/null || true
certbot certonly --standalone --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN"
echo "Certificate installed under /etc/letsencrypt/live/$DOMAIN/"
