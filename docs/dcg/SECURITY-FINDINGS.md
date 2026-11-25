# DCG security findings (V14.3 evidence pack)

**This is an internal, automated and manual-by-the-developer review. It is NOT an independent security assessment** and must not be
represented as one. It exists to give an independent reviewer a head start. Date: 2026-11-25. Branch `feature/datebuk-dcg-v12-final-closure`.

## 1. Automated dependency audit — 195 advisories, **NOT PASSED**
Method: production dependency tree of `apps/api`, `apps/web`, `apps/signaling` (`pnpm ls --prod --depth Infinity`) checked against
npm's bulk-advisory endpoint (`pnpm audit` itself hangs: pnpm 9.5 calls npm's retired audit API). Raw result: **8 critical, 86 high, 87 moderate, 14 low**.

| Package (installed) | Crit | High | Mod | Why it matters here |
|---|---|---|---|---|
| **next 16.1.6** | 4 | 14 | 20 | Critical: unauthenticated RCE (image optimization AVIF/SVG, `use cache`, Windows hosts). High: **Middleware/Proxy bypass** (page gating in `proxy.ts` lives here), SSRF in rewrites/image optimization/Server Actions, DoS. Patched lines start at 16.2.x; several need **>16.4.0**. |
| tar 6.2.1 | 1 | 8 | 3 | build/install-time tooling path (DoS). |
| fast-xml-parser 5.3.4 | 1 | 2 | 2 | entity-expansion bypass (AWS SDK Textract/Rekognition response parsing). |
| next-auth 4.24.13 | 1 | 1 | 1 | email-normalisation account-takeover class; `getToken()` crash on malformed Bearer. Confirm whether NextAuth is actually used for sign-in (`app/api/auth/[...nextauth]`). |
| **proxy-addr 2.0.7** | 1 | 0 | 0 | IP spoofing via IPv4-mapped IPv6 in trusted-proxy subnets. `req.ip` feeds the OTP/fraud IP signals, login throttling and the admin IP allow-list. The API uses `trust proxy = 1` (hop count, not subnets), which narrows but does not remove the concern. |
| axios 1.13.5 | 0 | 12 | 21 | outbound HTTP (RevenueCat/Stripe helpers). |
| multer 1.4.5-lts.2 → **2.0.2** | 0 | 7 | 1 | Introduced by this work for ID-capture uploads. Upgraded to 2.0.2 (this branch); advisories show **2.1.1** as the first fully patched version — upgrade again. |
| nodemailer 6.10.1, react-router 7.13.0, brace-expansion, nanoid, sharp, engine.io, minimatch, postcss, socket.io-parser, browserslist, ws, lodash, form-data, path-to-regexp, body-parser | — | 1–6 each | — | mostly DoS / ReDoS. |

**Action required before production** (nothing here was changed except multer, to avoid an unverified framework upgrade at the end of this
milestone): upgrade Next.js to a release above every listed range and re-run the browser suite (the proxy gate is part of what it exercises);
upgrade axios, tar, fast-xml-parser, next-auth (or remove if unused), proxy-addr (via express), nodemailer, react-router, sharp; re-run this audit until
critical/high are zero or each is individually justified. Mitigating context: every API permission and MFA step-up is enforced in the NestJS API,
independent of the Next proxy, so a proxy bypass exposes page shells rather than data/actions — but that is a mitigation, not a pass.

## 2. Secret scanning — passed for the committed set
Patterns (Stripe/AWS/GitHub/Slack/Google keys, private keys, Twilio `AC…`/`SK…` SIDs, JWTs, DB URLs with credentials, and the passwords from the local
credentials file) were searched across everything git would include. No matches other than two APNs validator scripts that merely test for the string
`BEGIN PRIVATE KEY`. Local `.env` files are git-ignored. **Not a substitute** for a dedicated scanner (gitleaks/trufflehog) in CI, which should be added.

## 3. Authorization testing — passed (automated)
- Access matrix through the **real guard classes** (`sms-admin.authz.spec.ts`): customer / support / superadmin × every read and management endpoint; missing, expired,
  foreign-user, wrong-purpose, session-token-as-step-up, wrong-secret and garbage step-up tokens; module-off switch.
- **Real-browser** run (`e2e-communications.mjs`, 31 checks): genuine MFA, step-up prompts, wrong code, expired token re-prompt, staff read-only UI, API 403s from the staff's own browser, customer and unauthenticated redirects, server-set httpOnly role cookies.
- Defects found and fixed by this testing (all pre-existing): (a) staff login OTP check could never succeed (it verified against the *encrypted* TOTP secret); (b) the admin web login failed with a 502 for any MFA-enrolled admin; (c) after OTP, no server-verified role cookies were set, so `/admin` and `/staff` stayed unreachable; (d) staff OTP redirected to the customer dashboard; (e) the API's CORS allowed only the main web origin, so the admin portal (own origin) could not call it from the browser.
- **Residual risk**: the proxy's role cookies (`dp_admin`, `dp_staff`) now come from a server route (`/api/auth/establish-session`) that asks the API about the token, instead of being client-set, but other login routes still set them directly. Page gating remains defence-in-depth only.

## 4. Encryption and key review
- Vault: AES-256-GCM, random 96-bit IV, **AAD binds each ciphertext to its account and field**, versioned payloads, strict 32-byte base64 keys (never stretched from a passphrase), no fallback to another key for writes. Legacy (TOTP-key) payloads are migration-only.
- Key separation: vault key (`DCG_ENCRYPTION_KEY`) ≠ TOTP key ≠ **HMAC root key (`DCG_HMAC_KEY`)**; production boot refuses a missing/short/equal key set. HMAC subkeys are purpose-separated (recipient / ip / device / otp).
- Rotation: tested (old versions readable until migrated; migration verifies a decrypt round-trip before writing; TOTP seeds untouched).
- **Open**: `DCG_HMAC_KEY` and the vault keys must be backed up in a secret manager separate from DB backups (DR drill proves credentials are unrecoverable without them). No HSM/KMS integration: keys live in process env.

## 5. Webhook security — passed (automated)
Signature verified with the Auth Token of the *named account*, URL rebuilt from `SMS_WEBHOOK_BASE_URL` (not Host headers); mandatory in production (cannot be disabled; boot refuses); a callback may only touch a message sent through the account that signed it; replays de-duplicated; transitions go through an explicit model; callbacks can't advance undispatched messages; rejection counter + alert. Twilio's published signature test vector passes. **Not tested against real Twilio traffic.**

## 6. OTP / recovery / fraud review
CSPRNG 6-digit codes, never stored (keyed HMAC bound to challenge+purpose+recipient+user), 5-minute expiry, single use under concurrency (10 parallel correct submissions → 1 success), atomic attempt cap (60 parallel wrong guesses → exactly 5 attempts), cooldown and hourly cap un-raceable (10 parallel requests → 1 challenge), anti-enumeration (identical answers), privileged accounts excluded from SMS recovery, recovery token 15 min / single-use / consumed by the existing reset flow (which revokes sessions). Fraud controls are temporary throttles/blocks; an account is never suspended automatically; IPs and devices stored only as keyed hashes.
**Caveats**: thresholds are proposed defaults, not tuned on real traffic; SMS pumping heuristics are simple distinct-recipient counts; no carrier lookup / destination-risk scoring; SIM-swap risk of SMS recovery for ordinary accounts is accepted by design (documented, privileged accounts excluded).

## 7. Privacy review
- Message bodies, OTPs and verification links are never logged (dev opt-in `DCG_DEV_LOG_BODIES`, refused in production; tested). Outbox recipient/body are encrypted and erased on leaving the queue. Dashboards/health snapshots carry counts only; consent lookup is a POST and masked; staff see last-4 only.
- Retention job + erasure endpoint implemented (STOP list intentionally never purged; consent history deletion only via the retention path, enforced by a DB trigger). **Retention periods are proposed defaults — confirm with counsel.**
- Not reviewed: ID/face verification data handling beyond "images are processed in memory and discarded"; DPIA/biometric-law (BIPA etc.) obligations.

## 8. Static review notes
No `eval`, no `$queryRawUnsafe` with user input in the new code (raw SQL is tagged-template parameterized); `dangerouslySetInnerHTML` unused in new components; all new endpoints are DTO/typed or manually validated and throttled. No SAST tool (Semgrep/CodeQL) was run — **recommended in CI**.

## 9. Not done / for the independent reviewer
Penetration test; SAST/DAST; threat model review; cloud/infra review (TLS termination, WAF, secrets storage, network policy); live Twilio behaviour; production-scale load; supply-chain controls (lockfile review, provenance); the 195 advisories above.
