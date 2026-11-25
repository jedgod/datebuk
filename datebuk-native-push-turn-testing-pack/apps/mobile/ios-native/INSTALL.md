# iOS installation

1. Run `npx expo prebuild`.
2. Enable these capabilities in Xcode:
   - Push Notifications
   - Background Modes → Voice over IP
   - Background Modes → Remote notifications
3. Add the supplied Swift files to the iOS application target.
4. Add `DateBukVoipPush.m` as the Objective-C React Native bridge.
5. In `AppDelegate`, call:

```swift
DateBukVoipPush.shared.start()
```

6. Add the `.voip` APNs topic on the server:
   `com.datebuk.app.voip`.
7. Use a real iPhone. PushKit is not a complete simulator test.
8. The app must report each genuine VoIP push to CallKit immediately.
