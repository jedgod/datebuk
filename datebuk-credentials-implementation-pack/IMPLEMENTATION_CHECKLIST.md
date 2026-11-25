# Implementation Checklist

- [ ] API and TURN DNS records resolve
- [ ] APNs `.p8`, Key ID, Team ID, and bundle ID configured
- [ ] iOS Push Notifications and VoIP background mode enabled
- [ ] Firebase Android app registered with exact package name
- [ ] `google-services.json` installed
- [ ] Firebase Admin service account installed
- [ ] TURN secret generated and shared only between API and Coturn
- [ ] UDP/TCP/TLS TURN ports open
- [ ] Let's Encrypt certificate issued and renewal tested
- [ ] Android release keystore created and backed up
- [ ] iOS distribution signing configured
- [ ] `python scripts/preflight.py` passes
- [ ] physical iPhone and Android call tests pass
