# Deployment Checklist

## Infrastructure

- [ ] public TURN hostname configured
- [ ] DNS records created
- [ ] TLS certificate installed
- [ ] PostgreSQL migrations applied
- [ ] Redis persistence configured
- [ ] firewall allows 3478 UDP/TCP, 5349 TCP, and relay range
- [ ] health checks enabled
- [ ] backups and monitoring enabled

## API

- [ ] production environment variables loaded
- [ ] APNs and Firebase secrets readable
- [ ] JWT secret rotated
- [ ] CORS origin restricted
- [ ] rate limiting added
- [ ] missed-call timeout worker running
- [ ] push failures observable

## iOS

- [ ] Push Notifications capability
- [ ] Voice over IP background mode
- [ ] Remote notifications background mode
- [ ] release provisioning profile
- [ ] TestFlight physical-device validation

## Android

- [ ] production Firebase project
- [ ] release signing configured
- [ ] notification channel tested
- [ ] full-screen call UI tested
- [ ] Play policy review complete

## Release Gate

- [ ] Android → iPhone passed
- [ ] iPhone → Android passed
- [ ] locked-screen passed
- [ ] background passed
- [ ] terminated-app passed
- [ ] TURN relay passed
- [ ] cancellation passed
- [ ] missed-call passed
- [ ] invalid-token cleanup passed
- [ ] security checklist approved
