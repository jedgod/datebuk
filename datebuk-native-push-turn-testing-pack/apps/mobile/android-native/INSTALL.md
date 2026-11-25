# Android installation

1. Run `npx expo prebuild`.
2. Place `google-services.json` in `android/app/`.
3. Add the Google Services plugin and Firebase Messaging dependency.
4. Copy `DateBukFirebaseMessagingService.kt` into your application package.
5. Register the service in `AndroidManifest.xml` using the supplied snippet.
6. Create the `incoming_calls` notification channel.
7. Register the FCM token with `/api/devices/call-token`.
8. Test on a real Android device with:
   - screen unlocked
   - screen locked
   - app backgrounded
   - app force-stopped
   - battery saver enabled

High-priority FCM should only be used for urgent, user-visible call events.
Do not perform long network operations inside `onMessageReceived`.
