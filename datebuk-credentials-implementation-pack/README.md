# DateBuk Secure Credentials Implementation Pack

This pack provides a secure implementation workflow for Apple APNs VoIP, Firebase FCM, Coturn/TLS, and mobile app signing.

It contains no real credentials. Add your own values to protected local files or a secret manager.

## Included
- `.env.production` template
- secret generation scripts
- APNs `.p8` validation
- Firebase service-account validation
- Android `google-services.json` validation
- Coturn shared-secret and temporary credential tooling
- Let's Encrypt/Certbot setup
- Android release keystore generation
- Docker secret mounting
- production preflight validation

## Quick start
```bash
cp .env.production.example .env.production
bash scripts/generate-secrets.sh
python scripts/preflight.py
```

Then follow `APPLE_SETUP.md`, `FIREBASE_SETUP.md`, and `TURN_TLS_SETUP.md`.
