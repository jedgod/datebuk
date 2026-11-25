# TURN and TLS Setup

Create DNS records for `api.datebuk.example` and `turn.datebuk.example`.

Open:
- UDP/TCP 3478
- TCP 5349
- UDP 49160-49250
- TCP 80 for ACME validation
- TCP 443 for HTTPS

Generate secrets:
```bash
bash scripts/generate-secrets.sh
```

Issue TURN TLS certificate:
```bash
export TURN_DOMAIN=turn.datebuk.example
export CERTBOT_EMAIL=admin@datebuk.example
sudo -E bash scripts/install-certbot-turn.sh
```

Render Coturn configuration:
```bash
bash infra/render-turn-config.sh
```

Test renewal:
```bash
sudo certbot renew --dry-run
```
