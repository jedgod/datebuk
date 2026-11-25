# Android-to-iPhone and iPhone-to-Android Runbook

## Android Caller → iPhone Callee

1. Sign in to DateBuk on both devices.
2. Confirm FCM and PushKit tokens are registered.
3. Lock the iPhone.
4. Start a video call from Android.
5. Confirm APNs VoIP delivery.
6. Confirm CallKit appears on the iPhone.
7. Answer on iPhone.
8. Confirm WebRTC signaling completes.
9. Confirm two-way audio and video.
10. End on Android.
11. Confirm CallKit ends and database status becomes ENDED.

## iPhone Caller → Android Callee

1. Lock the Android device.
2. Start a voice call from iPhone.
3. Confirm high-priority FCM delivery.
4. Confirm Android full-screen call interface.
5. Answer on Android.
6. Confirm audio in both directions.
7. Cancel and reject in separate tests.
8. Confirm final statuses persist correctly.

## Evidence

- call ID
- push provider result
- device screenshots
- Socket.IO logs
- TURN allocation logs
- call database row
- delivery receipt rows
- timestamps
