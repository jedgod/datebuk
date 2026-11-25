# Locked, Background, and Terminated-App Tests

## iOS

- Foreground
- Background
- Locked screen
- App terminated by user
- Device restarted
- Poor network
- APNs token rotated

Expected:
- real VoIP push reaches device
- PushKit callback executes
- CallKit appears promptly
- answer/end actions reach React Native
- cancellation clears the native call

## Android

- Foreground
- Background
- Locked screen
- App process killed
- Force-stopped
- Battery saver
- Doze mode
- FCM token rotated

Expected:
- high-priority data message reaches device
- notification channel uses high importance
- full-screen intent opens when allowed
- token refresh is registered
- rejected/cancelled calls clear correctly
