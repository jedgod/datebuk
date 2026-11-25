# DCG API reference (all under `/api`)

Auth: `Authorization: Bearer <access token>`. "Step-up" = header `X-Step-Up-Token` from `POST /auth/step-up` (5 min). Module-gated by `DCG_ENABLED`.
Permissions are the repository's RBAC: **VIEW** = `ADMIN_VIEW_MESSAGING` (support + superadmin), **MANAGE** = `ADMIN_MANAGE_MESSAGING` (superadmin only).

## Authentication helpers
| Method & path | Access | Notes |
|---|---|---|
| `POST /auth/step-up` `{code}` | signed-in staff/admin with MFA | returns `{stepUpToken, expiresInSeconds}`; token is not a session credential |
| `POST /auth/phone/otp/request` `{phone}` | signed-in | OTP to verify a phone; per-IP 5/min + OTP/fraud limits |
| `POST /auth/phone/otp/verify` `{phone, code}` | signed-in | marks phone verified |
| `POST /auth/recovery/sms/request` `{email}` | public | always `{ok:true}`; texts a code only to ordinary accounts with a verified phone |
| `POST /auth/recovery/sms/verify` `{email, code}` | public | returns `{resetToken, expiresInSeconds:900}`; consume with the existing `POST /auth/reset-password` |
| `GET /subscriptions/usage` | signed-in | plan + live quota usage (feature-policy driven) |

## Communications admin — `/admin/sms/*`
| Path | Access | Purpose |
|---|---|---|
| `GET accounts`, `GET messages`, `GET analytics`, `GET audit`, `GET webhook-config`, `GET health`, `GET alerts`, `GET risk-events`, `GET compliance`, `GET messages/needs-review` | VIEW | read models (never any credential) |
| `POST risk-events/:id/review` `{decision}` | VIEW | confirm / dismiss a fraud event |
| `POST consent/lookup` `{phone}` | VIEW | masked consent + STOP/START history (POST so the number is not in a URL) |
| `POST accounts` · `accounts/:id/{validate,activate,suspend,revoke,rotate,spending}` | MANAGE + step-up (`validate`: MANAGE) | provider account lifecycle; rotation validates before swap; revoke wipes secrets |
| `POST senders` · `senders/:id/disable` | MANAGE + step-up | sender ownership checked with Twilio |
| `POST compliance` · `compliance/:id/status` | MANAGE + step-up | record registrations; approval needs an evidence reference |
| `POST emergency-stop` `{on, reason}` | MANAGE + step-up | halt/resume all outbound SMS (takes effect within seconds) |
| `POST reconcile/run` | MANAGE + step-up | run reconciliation now (never resends) |
| `POST messages/:id/reconcile` `{outcome:"sent"\|"not_sent"}` | MANAGE + step-up | human resolution of an `uncertain` message |
| `POST credentials/migrate?dryRun=` | MANAGE + step-up | re-encrypt credentials under the current vault key |
| `POST consent/erase` `{phone}` | MANAGE + step-up | verified erasure (STOP list kept) |
| Webhooks: `POST /sms/webhooks/status`, `/inbound` | Twilio signature | account-bound, replay-protected |

## Configuration
See `.env.example` ("Communications (DCG)" and "V12+ additions"). Required in production when `DCG_ENABLED=true`: `DCG_ENCRYPTION_KEY`, `DCG_HMAC_KEY` (distinct, 32 bytes base64), signature verification on, `SMS_WEBHOOK_BASE_URL` (https). Optional `ADMIN_PORTAL_URL` adds the admin portal origin to the API CORS allow-list.
