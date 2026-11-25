# DateBuk Native Push, TURN Security & Physical-Device Testing Pack

This pack completes the next communication stage for the DateBuk mobile and web applications:

1. **iOS PushKit VoIP notifications**
2. **Android Firebase Cloud Messaging call notifications**
3. **Short-lived Coturn credentials**
4. **End-to-end testing on physical devices**
5. **Call timeout, cancellation and delivery receipts**

It is designed to extend the earlier DateBuk realtime communication pack.

## Important limitations

This source code still requires credentials that cannot be included in a downloadable pack:

- Apple Developer Team ID
- APNs `.p8` key and Key ID
- DateBuk iOS bundle identifier
- Firebase service-account JSON
- `google-services.json`
- public TURN hostname, TLS certificate and shared secret
- real signing certificates/provisioning profiles

Use an **Expo development build or bare React Native build**. Expo Go cannot run the required native PushKit, CallKit, FCM and WebRTC modules.

## Architecture

```text
Caller
  ↓ POST /api/calls
DateBuk Call API
  ├── iOS device → APNs VoIP push → PushKit → CallKit
  ├── Android device → FCM high-priority data message → Call service/UI
  └── GET /api/turn-credentials → temporary TURN username/password
                                      ↓
                                   Coturn
```

## Included folders

```text
apps/
  api/                    Node/Express call push and TURN API
  mobile/
    ios-native/           Swift PushKit + CallKit bridge
    android-native/       Kotlin FCM call service
    src/                  React Native call bootstrap and token registration
infra/
  coturn/                 temporary-credential configuration
tests/
  device-matrix.md
  e2e-call-runbook.md
  scripts/
```

## Run order

### 1. Configure Coturn

```bash
cp infra/coturn/turnserver.conf.example infra/coturn/turnserver.conf
docker compose -f infra/docker-compose.yml up -d
```

### 2. Configure the API

```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```

### 3. Configure mobile native projects

Run Expo prebuild first:

```bash
cd apps/mobile
npm install
npx expo prebuild
```

Then copy or merge the supplied native files into the generated `ios/` and
`android/` projects, following:

- `apps/mobile/ios-native/INSTALL.md`
- `apps/mobile/android-native/INSTALL.md`

### 4. Install on physical devices

```bash
npx expo run:android --device
npx expo run:ios --device
```

### 5. Test

Follow `tests/e2e-call-runbook.md`.

## Security design

The client never receives the Coturn static shared secret. The API creates a
temporary username containing an expiration timestamp and signs it with
HMAC-SHA1, which is the Coturn TURN REST credential pattern.

VoIP pushes must represent real incoming calls. On iOS, the application reports
the call to CallKit immediately after receiving the PushKit payload.
