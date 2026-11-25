/**
 * Explicit delivery-state model for outbound SMS.
 *
 *   queued --claim--> dispatching --> accepted --> sending --> sent --> delivered
 *     |                  |  |  |                       |          |  \-> undelivered
 *     |                  |  |  \-> failed (definite)    \----------+---> failed
 *     |                  |  \-> uncertain (ambiguous: timeout / 5xx / lease lost)
 *     |                  \-> queued (retry after a provider rate-limit; safe, nothing was accepted)
 *     \-> canceled (opted out, expired, no longer wanted, account changed)
 *
 * `uncertain` is never retried automatically - the provider may already have accepted the text.
 * It is resolved only by an authenticated provider callback or an admin reconciliation.
 */
export type SmsState =
  | "queued"
  | "dispatching"
  | "accepted"
  | "scheduled"
  | "sending"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed"
  | "canceled"
  | "uncertain";

const TERMINAL: SmsState[] = ["delivered", "undelivered", "failed", "canceled"];

const ALLOWED: Record<SmsState, SmsState[]> = {
  queued: ["dispatching", "canceled"],
  dispatching: ["queued", "accepted", "failed", "uncertain", "canceled"],
  // Resolved by evidence only. A signed callback may jump straight to any later state.
  uncertain: ["accepted", "scheduled", "sending", "sent", "delivered", "undelivered", "failed"],
  accepted: ["scheduled", "sending", "sent", "delivered", "undelivered", "failed", "canceled"],
  scheduled: ["accepted", "sending", "sent", "delivered", "undelivered", "failed", "canceled"],
  sending: ["sent", "delivered", "undelivered", "failed"],
  sent: ["delivered", "undelivered", "failed"],
  delivered: [],
  undelivered: [],
  failed: [],
  canceled: [],
};

export const isTerminal = (s: string) => TERMINAL.includes(s as SmsState);
export const canTransitionSms = (from: SmsState, to: SmsState) => ALLOWED[from]?.includes(to) ?? false;

/** Twilio message statuses mapped onto ours ("queued" at Twilio means we were accepted). */
const PROVIDER_STATUS: Record<string, SmsState> = {
  queued: "accepted",
  accepted: "accepted",
  scheduled: "scheduled",
  sending: "sending",
  sent: "sent",
  delivered: "delivered",
  undelivered: "undelivered",
  failed: "failed",
  canceled: "canceled",
  read: "delivered",
};

/**
 * What a provider callback does to a message currently in `current`.
 * Returns the new state, or null when the callback must be ignored: an unknown status, a late
 * or duplicate event that would move backwards, or a message we have not dispatched yet
 * (a callback for something still `queued` cannot be genuine).
 */
export function applyProviderStatus(current: string, incoming: string): SmsState | null {
  const to = PROVIDER_STATUS[(incoming ?? "").toLowerCase()];
  if (!to) return null;
  if (to === current) return null;
  return canTransitionSms(current as SmsState, to) ? to : null;
}

/** Exponential backoff with a cap, for provider rate-limits only (seconds). */
export const retryDelaySeconds = (attempt: number) => Math.min(15 * 2 ** Math.max(0, attempt - 1), 15 * 60);
export const MAX_DISPATCH_ATTEMPTS = 5;

export type SendOutcome = "accepted" | "retry" | "failed" | "auth_failure" | "uncertain";

/**
 * How to treat Twilio's answer to "create message".
 *  - 2xx                        accepted
 *  - 429                        refused for rate: nothing was accepted, retry later
 *  - 401 / 403                  credentials/account rejected: failed, and the account is suspended
 *  - other 4xx                  the request was rejected: failed, retrying cannot help
 *  - 5xx, timeout, no response  ambiguous - the provider may have accepted it: uncertain, never retried
 */
export function classifyHttp(status: number | null): SendOutcome {
  if (status === null || status === 0) return "uncertain";
  if (status >= 200 && status < 300) return "accepted";
  if (status === 429) return "retry";
  if (status === 401 || status === 403) return "auth_failure";
  if (status >= 400 && status < 500) return "failed";
  return "uncertain";
}
