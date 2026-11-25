# Production Security Checklist

## Apple

- [ ] APNs key stored in a secret manager
- [ ] correct `.voip` topic configured
- [ ] VoIP pushes represent genuine calls only
- [ ] every received VoIP push is reported to CallKit promptly
- [ ] call cancellation and end states reach CallKit
- [ ] provisioning and entitlements validated

## Android

- [ ] Firebase service account stored securely
- [ ] `google-services.json` excluded from public repositories
- [ ] high-priority messages used only for urgent visible calls
- [ ] full-screen intent policy reviewed
- [ ] notification permission requested
- [ ] invalid FCM tokens disabled
- [ ] token rotation handled

## TURN

- [ ] static TURN secret never sent to clients
- [ ] credentials expire within 5–10 minutes
- [ ] TLS certificate valid
- [ ] UDP/TCP/TLS transports tested
- [ ] relay port range allowed in firewall
- [ ] quotas and rate limits configured
- [ ] allocation logs monitored

## API

- [ ] JWT validation uses production identity provider
- [ ] call rate limiting enabled
- [ ] block checks enforced
- [ ] request validation enabled
- [ ] audit events retained
- [ ] tokens and secrets redacted from logs
- [ ] database backups enabled
- [ ] observability and alerting enabled

## Privacy

- [ ] microphone disclosure published
- [ ] camera disclosure published
- [ ] call metadata retention policy defined
- [ ] users can block and report callers
- [ ] exact media is not recorded without explicit consent
