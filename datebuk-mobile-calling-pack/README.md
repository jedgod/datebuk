# DateBuk Mobile Calling Pack

Production-oriented starter for native mobile voice/video calling in DateBuk.

## Included
- Voice-call and video-call screens
- WebRTC peer connection using `react-native-webrtc`
- Socket.IO signaling server
- Native incoming-call UI using `react-native-callkeep`
- Expo push-token registration and incoming-call notifications
- Call state, mute, speaker, camera toggle, camera flip, accept, reject and hang up
- Android/iOS native permission configuration

## Important
This pack **does not run in Expo Go** because WebRTC and CallKeep contain native code. Use an Expo development build.

## 1. Run signaling server
```bash
cd apps/signaling-server
cp .env.example .env
npm install
npm run dev
```

## 2. Configure mobile
```bash
cd apps/mobile
cp .env.example .env
npm install
npx expo prebuild
npx expo run:android
# macOS only: npx expo run:ios
```

Set `EXPO_PUBLIC_SIGNALING_URL` to your computer's LAN IP, not `localhost`, when testing on a phone or emulator.

Example:
```env
EXPO_PUBLIC_SIGNALING_URL=http://192.168.1.50:4000
EXPO_PUBLIC_API_URL=http://192.168.1.50:4000
```

## Test flow
1. Launch two builds/devices.
2. Sign each device in using a different DateBuk user ID in `App.tsx`.
3. Start a voice or video call from one device.
4. Accept from the incoming-call screen on the other device.

## Production checklist
- Add authenticated JWT handshakes to Socket.IO.
- Store Expo push tokens per user in the database.
- Replace in-memory server maps with Redis.
- Deploy a TURN server and set `EXPO_PUBLIC_TURN_URL`, username and credential.
- Use APNs VoIP pushes for reliable terminated-state iOS incoming calls.
- Add FCM high-priority data messages for Android terminated-state calls.
- Persist call records and enforce block/privacy rules.
