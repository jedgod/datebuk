# Integration into the existing DateBuk app

1. Copy `src/services`, `src/hooks`, and `src/screens/CallScreen.tsx` into the mobile project.
2. Register the authenticated user's ID immediately after login with `connectSignaling(user.id)`.
3. Open `CallScreen` from the Messages/profile page with `peerId`, `callId`, and `media`.
4. Keep the incoming-call socket listener near the root navigator so calls can arrive from every screen.
5. Save call records on your backend: initiator, recipient, media type, startedAt, answeredAt, endedAt, duration and outcome.
6. Enforce DateBuk block lists, subscription entitlements, age rules and moderation restrictions before emitting `call:invite`.
