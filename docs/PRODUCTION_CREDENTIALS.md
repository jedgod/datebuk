# DateBuk production credentials

No real credential is stored in this repository. Copy `.env.production.example` to `.env.production`, replace every placeholder, and place secret files under the Git-ignored `secrets/` layout.

## Apple APNs, PushKit, and CallKit

1. Register `com.datebuk.app` in Apple Developer and enable Push Notifications.
2. Create an APNs authentication key, record its Key ID and Team ID, and store the `.p8` as `secrets/apple/AuthKey.p8`.
3. Use the VoIP topic `com.datebuk.app.voip`.
4. The Expo configuration enables production APS entitlement plus `audio`, `voip`, and `remote-notification` background modes.
5. Create matching development and distribution provisioning profiles and test PushKit/CallKit on a physical iPhone. Expo Go is insufficient.

## Firebase and Android signing

1. Register Android package `com.datebuk.app` in Firebase.
2. Put the client configuration at `apps/mobile/android/app/google-services.json`.
3. Put the Firebase Admin service account at `secrets/firebase/firebase-service-account.json`.
4. Generate the release keystore with `scripts/credentials/create-android-keystore.ps1` on Windows or the `.sh` equivalent on Linux.
5. Supply signing paths and passwords through protected environment variables or mounted `_FILE` secrets. Release builds fail closed when signing material is absent.

## TURN and TLS

1. Point `TURN_DOMAIN` DNS to the Coturn host.
2. Open UDP/TCP 3478, TCP 5349, UDP 49160-49250, and TCP 80 for ACME validation.
3. Generate one strong shared secret and mount the same value into the API and Coturn. Never send it to clients.
4. Render `infra/coturn/turnserver.conf` with `infra/render-turn-config.sh`.
5. Run `scripts/credentials/install-certbot-turn.sh` as root. It installs a renewal hook that restarts Coturn after certificate renewal.

## Validation and deployment

```powershell
Copy-Item .env.production.example .env.production
npm run credentials:preflight -- .env.production
docker compose --env-file .env.production -f docker-compose.production.yml config
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

The API validates production secrets, credential file paths, TURN settings, and URL safety at startup. Docker mounts credential files read-only under `/run/secrets`.
