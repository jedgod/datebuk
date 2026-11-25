# Release gates — NO-GO
- [ ] Inspect actual DateBuk repo and reconcile schema/auth contracts.
- [ ] Install locked dependencies, run dependency/security scans and compile UI.
- [ ] Real PostgreSQL migration and rollback rehearsal; verify runtime role cannot truncate audit or modify policies; separate owner/runtime roles.
- [ ] Concurrent quota, idempotency, suspension and block/consent race tests.
- [ ] Stripe checkout/customer binding, price validation, refunds, chargebacks, missed-event reconciliation, webhook ordering tests.
- [ ] Apple signed transaction and Google Play verification, account binding and restore tests.
- [ ] Admin MFA, independent approval, policy publication, staff assignment/acknowledgment/closure, support rate limits.
- [ ] Redis restart, replay, duplicate delivery, consumer recovery and alert routing.
- [ ] Session leases and signaling/TURN integration, guest policy approval, media revocation evidence. P2P signaling alone cannot stop media.
- [ ] AI reservations, moderation and privacy review; location consent/revocation.
- [ ] Browser and physical mobile testing, monitoring, backups, recovery and independent security review.

Rollback: do not drop production tables or volumes. Stop new feature admissions, disable integration routes, preserve audit and provider records, restore tested application version and reconcile provider state. For disposable scratch volumes only, recreate the database. No destructive rollback SQL supplied because the host schema is unknown.

SLA proposal: critical 5m, high 30m, medium 4h, low 48h, first response only. Worker emits breach events; staffing and notifications are not configured.
