# End-to-end call runbook

## Prerequisites

- Two authenticated DateBuk test accounts
- Two physical devices
- APNs and FCM tokens stored by the API
- TLS-secured API and WebSocket endpoints
- public Coturn server reachable on UDP/TCP 3478 and TLS 5349
- relay port range allowed by the firewall

## Test sequence

1. Sign in as account A on device A.
2. Sign in as account B on device B.
3. Confirm tokens were registered.
4. Call B from A.
5. Confirm the API creates one call session.
6. Confirm APNs VoIP or FCM delivery succeeds.
7. Confirm the native incoming-call interface appears.
8. Answer on B.
9. Confirm signaling connects.
10. Confirm temporary TURN credentials are fetched.
11. Confirm audio in both directions.
12. Enable video and confirm video in both directions.
13. Toggle mute, speaker and camera.
14. End the call from each side in separate tests.
15. Confirm both clients return to the conversation screen.
16. Confirm duration and final status are stored.
17. Repeat with the callee app backgrounded, locked and terminated.
18. Repeat on different networks to force TURN relay usage.

## Evidence to capture

- API logs with call ID
- APNs/FCM message result
- device screenshots
- `chrome://webrtc-internals` for web testing
- Coturn allocation logs
- call-session database record
- timestamps for created, delivered, answered and ended events
