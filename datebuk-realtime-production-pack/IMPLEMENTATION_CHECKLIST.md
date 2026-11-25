# Implementation checklist

## Required before production

- [ ] Replace development JWT secret.
- [ ] Integrate DateBuk's real authentication middleware.
- [ ] Configure TLS for API, Socket.IO, and TURN.
- [ ] Deploy Coturn with a public IP and restricted relay ranges.
- [ ] Use short-lived TURN credentials instead of static client credentials.
- [ ] Add APNs VoIP push for robust iOS background calling.
- [ ] Add Firebase high-priority data messages for Android call wake-up.
- [ ] Configure CallKeep/CallKit native project settings.
- [ ] Add timeout job to mark unanswered calls as MISSED.
- [ ] Add rate limits per user, device, and IP.
- [ ] Add abuse thresholds for mass calling.
- [ ] Encrypt sensitive logs and redact tokens.
- [ ] Add Sentry/OpenTelemetry monitoring.
- [ ] Test poor networks, airplane mode, background, locked screen, and app termination.
- [ ] Publish privacy disclosures for microphone, camera, push, and call metadata.
