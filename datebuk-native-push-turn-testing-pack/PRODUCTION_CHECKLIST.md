# Production checklist

## Apple

- [ ] Apple Push Notifications capability enabled
- [ ] Voice over IP background mode enabled
- [ ] APNs token key uploaded securely
- [ ] `.voip` topic matches the bundle identifier
- [ ] every VoIP push represents a real call
- [ ] every received VoIP push is reported promptly to CallKit
- [ ] call cancellation is propagated to CallKit

## Android

- [ ] Firebase project linked to the production package
- [ ] FCM service account stored in a secret manager
- [ ] notification permission requested on supported Android versions
- [ ] incoming-call channel uses high importance
- [ ] full-screen intent complies with Play policies
- [ ] high priority is used only for time-sensitive visible calls
- [ ] token refresh and invalid-token deletion are implemented

## TURN

- [ ] static shared secret is server-side only
- [ ] temporary credential TTL is 5–10 minutes
- [ ] TURN uses a public hostname and TLS certificate
- [ ] UDP, TCP and TLS transports tested
- [ ] relay port range allowed in firewall/security group
- [ ] bandwidth and allocation quotas configured
- [ ] secrets rotated and monitored

## Reliability

- [ ] 30-second unanswered-call timeout
- [ ] caller cancellation reaches every callee device
- [ ] duplicate pushes are idempotent by call ID
- [ ] calls cannot be placed to blocked users
- [ ] per-user/IP call rate limiting
- [ ] call status persisted transactionally
- [ ] delivery, answer and end timestamps recorded
- [ ] metrics, tracing and crash reporting enabled
- [ ] physical-device matrix completed before release
