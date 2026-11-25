# DateBuk Final-Final Native Calling Pack

This pack consolidates the complete production-ready native calling layer for DateBuk across iOS, Android, WebRTC signaling, TURN security, delivery receipts, call lifecycle, and physical-device validation.

## Included

- iOS APNs VoIP PushKit delivery
- Native iOS CallKit incoming-call interface
- Android FCM high-priority call notifications
- Android full-screen incoming-call notification service
- FCM and PushKit token registration
- Short-lived Coturn credentials generated with HMAC
- TURN UDP, TCP, and TLS configuration
- Temporary ICE-server credential endpoint
- Physical-device testing matrix
- Cross-platform Android-to-iPhone test workflow
- Locked-screen, background, and terminated-app tests
- Missed-call, cancellation, timeout, and invalid-token handling
- Production security and deployment checklists
- Realtime Socket.IO signaling
- PostgreSQL/Prisma call persistence
- Redis-backed presence and scale-out
- CI validation workflow
- Docker Compose infrastructure

## Architecture

```text
Caller Mobile/Web
   |
   | HTTPS / Socket.IO / JWT
   v
DateBuk Calling API
   ├── PostgreSQL: calls, devices, delivery receipts, blocks, reports
   ├── Redis: presence, call state, pub/sub
   ├── APNs VoIP: iOS incoming call delivery
   ├── FCM high priority: Android incoming call delivery
   ├── TURN credential endpoint: short-lived HMAC credentials
   └── Coturn: UDP/TCP/TLS relay
            |
            v
      Callee Mobile Device
      ├── iOS: PushKit → CallKit
      └── Android: FCM → full-screen call UI
```

## Important

The following secrets are intentionally not included:

- Apple APNs `.p8` key
- APNs Key ID and Team ID
- Firebase service-account JSON
- `google-services.json`
- production JWT secret
- TURN shared secret
- TLS certificates
- mobile signing certificates and provisioning profiles

Use an Expo development build or bare React Native build. Expo Go cannot run the required custom native modules.

## Quick Start

### 1. Infrastructure

```bash
cp infra/coturn/turnserver.conf.example infra/coturn/turnserver.conf
docker compose -f infra/docker-compose.yml up -d
```

### 2. API

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name final_native_calls
npm run dev
```

### 3. Mobile

```bash
cd apps/mobile
npm install
npx expo prebuild
```

Then merge the supplied native iOS and Android files as described in:

- `apps/mobile/ios-native/INSTALL.md`
- `apps/mobile/android-native/INSTALL.md`

Run on physical devices:

```bash
npx expo run:android --device
npx expo run:ios --device
```

### 4. Test

Follow:

- `tests/physical-device-matrix.md`
- `tests/cross-platform-runbook.md`
- `tests/locked-background-terminated-tests.md`

## Production Completion Criteria

This pack should be considered complete only after:

1. APNs VoIP push reaches a real iPhone.
2. CallKit displays the incoming call while locked.
3. FCM reaches a real Android phone in background.
4. Android full-screen incoming-call UI opens.
5. Android-to-iPhone and iPhone-to-Android calls connect.
6. TURN relay is confirmed on separate networks.
7. Missed, rejected, cancelled, and ended states persist correctly.
8. Invalid push tokens are disabled automatically.
9. Physical-device test evidence is captured.
10. Security checklist is signed off.
