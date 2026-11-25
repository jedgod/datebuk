# DCG V12.1–V15.0 — release-gate report

**Verdict: NO-GO for production.** Engineering for everything that does not need live Twilio credentials is implemented and tested; the
remaining gates are external (live provider, regulatory approvals, independent review) or are open security findings (dependency advisories).
Live SMS stays **disabled** (`DCG_LIVE_SMS_ENABLED=false`). Nothing was purchased, sent, pushed, merged or deployed.

Legend: ✅ passed with evidence · 🟡 implemented, evidence is simulated-provider only · ❌ not passed / open · ⬜ external, not started

## Engineering gates

| Gate | Status | Evidence |
|---|---|---|
| Credential vault: dedicated key, isolation, versioned rotation | ✅ | `credential-vault.spec.ts`; DR drill (restore decrypts only with the vault key); migration test over real HTTP (earlier milestone) |
| Atomic spending reservation | ✅ | `sms-outbox.integration.spec.ts`, `sms-load.integration.spec.ts`: 600 simultaneous callers vs a 200-segment cap → exactly 200 admitted, never more; bounded waves fill to exactly 200 |
| Durable outbox on existing pg-boss, leases, idempotency, crash recovery | ✅ | 1,000 messages × 8 workers with injected 429/5xx/timeout/400: no message sent twice except bounded 429 retries, none stuck; 10 abandoned leases → `uncertain`, 0 provider calls |
| Never auto-resend an ambiguous request | ✅ | state model + load test asserts only a 429 is ever followed by another provider call |
| Dispatch-time re-authorization (consent, suppression, provider, budget, registration, emergency stop) | ✅ | outbox, consent-compliance, reconcile-monitoring suites |
| Message privacy in logs | ✅ | tested: dev fallback logs metadata only; opt-in refused in production; encrypted outbox payload erased after dispatch |
| Webhook signature mandatory in production, account/message binding, dedupe, ordering | ✅ (simulated) | `sms-outbox.integration.spec.ts`; config test; 400 concurrent duplicate callbacks apply once |
| OTP engine (HMAC, expiry, single use, atomic attempts, cooldown, hourly cap, binding) | ✅ | `otp-recovery.integration.spec.ts` (24 tests, real PostgreSQL concurrency) |
| Account recovery (anti-enumeration, privileged excluded, single-use token, session revocation via existing reset) | ✅ (token + OTP layers) / 🟡 | token issuance proven; the final password reset and session revocation reuse the existing, unchanged `AuthService.resetPassword` (not re-run end-to-end in this milestone) |
| Fraud intelligence (velocity, pumping, repeated failure, risk events, review) | 🟡 | tested on synthetic traffic; thresholds untuned |
| Consent management (per recipient+purpose, history, STOP/START, retention, erasure) | ✅ | `consent-compliance.integration.spec.ts`; DB trigger makes history append-only |
| Regulatory compliance records + enforcement (A2P 10DLC, toll-free) | ✅ (records/enforcement) / ⬜ (actual approvals) | approvals require evidence text; sender without approvals cannot send; **no real registration exists** |
| Scheduled reconciliation (pg-boss job, lease, bounded, rate-limit aware, escalate-don't-guess) | 🟡 | tested against a simulated provider only |
| Monitoring, alerts, incident workflow, emergency stop | ✅ (simulated) | alerts raised through the existing SecurityAlert pipeline; emergency stop proven in API, DB and browser |
| Admin Communications Center / Staff Operations / Customer usage | ✅ | **31/31 real-browser checks** (`e2e-communications.mjs`): genuine MFA, step-up, expired step-up, staff read-only, RBAC, redirects, screenshots |
| Disaster recovery: encrypted backup, isolated restore, vault-key recovery, rollback + roll-forward | ✅ | `scripts/dcg-dr-drill.mjs` → `DR-DRILL-2026-11-25.md` (16/16). RTO measured, RPO stated |
| Performance / concurrency / failure injection | 🟡 | simulated provider; machine was shared with dev servers — correctness evidence, not a benchmark |
| Automated test suite | ✅ | 348 tests: 13 unit suites (242) + 5 integration suites (106, real PostgreSQL, run serially with the dev API stopped) |
| Dependency scan | ❌ | **195 advisories (8 critical, 86 high)** — see `SECURITY-FINDINGS.md`. Next.js 16.1.6 critical RCE + proxy bypass is the priority |
| Secret scan | ✅ (committed set) | patterns clean; add gitleaks to CI |
| Redis interruption testing | ⬜ n/a | no Redis is used by this subsystem (PostgreSQL locks/leases + pg-boss); the sweeper recovers after DB or worker interruption (tested) |

## External gates (cannot be closed by code)

| Gate | Status |
|---|---|
| Real Twilio Account SID / Auth Token, API Key, sender number or Messaging Service verified | ⬜ |
| Applicable messaging registration approved (A2P 10DLC / toll-free) | ⬜ |
| Public HTTPS webhook configured; signed callbacks received; STOP/START verified live | ⬜ |
| Controlled outbound SMS delivered; spending limits + emergency stop verified live; credential rotation verified live | ⬜ |
| Independent security assessment | ⬜ (this repo's `SECURITY-FINDINGS.md` is an internal evidence pack, not an assessment) |
| Legal review of consent text, retention periods, biometric/ID-verification obligations | ⬜ |

## Live certification procedure (V15.0) — to run only after approval
1. Pre-flight: all engineering gates green; Next.js and other critical/high advisories resolved or justified; `DCG_ENABLED=true`, `DCG_LIVE_SMS_ENABLED=false`, `DCG_REQUIRE_REGISTRATION=true`, `DCG_WEBHOOK_SIGNATURE_REQUIRED=true`, vault + HMAC keys in a secret manager, `SMS_WEBHOOK_BASE_URL` = public https origin.
2. Superadmin signs in with MFA → Communications Center → **Register** the dedicated Twilio account/subaccount (credentials are validated by Twilio, stored encrypted) → **Add sender** (ownership checked) → record **compliance approvals with their real evidence** → set **spending caps** (start tiny, e.g. 5 segments/day) and **allowed prefixes** (+1 only) → **Activate**.
3. Point Twilio's status + inbound webhooks at the URLs shown on the Webhooks tab. Confirm an unsigned request is rejected (403) and the rejection counter moves.
4. With `DCG_LIVE_SMS_ENABLED=true`, send **one** message to a pre-authorized test handset (OTP flow). Verify: delivered; signed status callbacks advance the state; the message body is absent from logs and the DB.
5. From that handset reply **STOP** → number suppressed, consent history shows `stop`, new sends refused; reply **START** → block lifted, **no** marketing consent granted.
6. Spending cap: exhaust the tiny cap deliberately → next send refused. **Emergency stop**: engage → queue waits, nothing sent; release.
7. Rotate credentials (new token validated before swap), confirm sending continues; suspend + revoke a throwaway subaccount and confirm no fallback to another account.
8. Reconciliation: run now; confirm no resend; force a timeout in a staging provider if available to see an `uncertain` message escalate.
9. Record results, then (and only then) decide on production activation with separate authorization. Do not purchase numbers or send to anyone who has not agreed.
