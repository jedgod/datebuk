# Android Native Installation

1. Run `npx expo prebuild`.
2. Place `google-services.json` in `android/app/`.
3. Add Firebase Messaging to the Android app module.
4. Copy `DateBukFirebaseMessagingService.kt`.
5. Register the service using the manifest snippet.
6. Create the `incoming_calls` notification channel.
7. Register refreshed FCM tokens with `/api/devices/call-token`.
8. Test foreground, background, locked-screen, terminated, and battery-saver states.
9. Verify Play policy compliance for full-screen intents.
