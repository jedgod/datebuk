# Native calling runtime matrix — 2026-07-11

This report uses strict evidence rules: an item is `PASS` only when it was observed end-to-end. Missing devices, credentials, or transport access are recorded as `FAIL`, not inferred as success.

| # | Acceptance item | Result | Evidence |
|---|---|---|---|
| 1 | Android native dependency compatibility and debug build | PASS | `react-native-screens` is pinned to 4.16.0; native CMake and animation resources are present; `app-debug.apk` was produced (157,157,203 bytes). |
| 2 | Android → Android foreground ring, answer, two-way media, hang-up | FAIL | Only one Android emulator was connected; a second device was unavailable. |
| 3 | Android locked/background high-priority incoming call UI | FAIL | No second physical Android device or configured FCM credentials were available. Expo local notification wiring and CallKeep compile, but end-to-end wake delivery was not observed. |
| 4 | Android ↔ iPhone cross-platform CallKeep/CallKit call | FAIL | No iPhone was connected and APNs/PushKit credentials were not configured in this workspace. |
| 5 | TURN-relayed audio/video on separate or restricted networks | FAIL | No two-device network path was available and `TURN_URL` / `TURN_SHARED_SECRET` were not configured, so relay allocation and two-way media could not be observed. |

## Additional runtime evidence

- `npx expo run:android --no-bundler` was rerun after the compatibility repair.
- Direct APK installation was attempted after the Expo wrapper stalled, but the only emulator's ADB transport stopped responding, including to `get-state`.
- API build: PASS.
- Mobile TypeScript: PASS.
- Signaling TypeScript: PASS.

## Required rerun prerequisites

1. Connect two Android physical devices, or one Android and one iPhone, and confirm both appear in the platform tooling.
2. Configure FCM plus APNs/PushKit credentials for background/terminated delivery.
3. Configure `TURN_URL` and `TURN_SHARED_SECRET` and place the devices on separate networks.
4. Apply the pending `MobileCallToken` database migration to the intended database after confirming the target environment.
