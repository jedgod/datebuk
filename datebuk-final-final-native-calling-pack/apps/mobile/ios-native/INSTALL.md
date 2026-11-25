# iOS Native Installation

1. Run `npx expo prebuild`.
2. Open the generated iOS project in Xcode.
3. Enable:
   - Push Notifications
   - Background Modes → Voice over IP
   - Background Modes → Remote notifications
4. Add `DateBukVoipPush.swift` and `DateBukVoipPush.m` to the app target.
5. Set the APNs VoIP topic to `<bundle-id>.voip`.
6. Register the PushKit token with `/api/devices/call-token`.
7. Use a physical iPhone for testing.
8. Report every genuine VoIP push to CallKit immediately.
9. Propagate cancellation and end events to CallKit.
