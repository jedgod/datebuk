import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Twilio's X-Twilio-Signature for a form-encoded webhook:
 * base64(HMAC-SHA1(authToken, fullUrl + each POST param name+value, sorted by name)).
 * `fullUrl` must be exactly the public URL configured in Twilio (scheme, host, path, query).
 */
export function expectedTwilioSignature(authToken: string, fullUrl: string, params: Record<string, unknown>): string {
  const data =
    fullUrl +
    Object.keys(params)
      .sort()
      .map((k) => k + String(params[k] ?? ""))
      .join("");
  return createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
}

export function validateTwilioSignature(
  authToken: string,
  signature: string | undefined,
  fullUrl: string,
  params: Record<string, unknown>,
): boolean {
  if (!signature) return false;
  const a = Buffer.from(expectedTwilioSignature(authToken, fullUrl, params));
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Delivery states only ever move forward; late or duplicate callbacks can't regress them. */
const RANK: Record<string, number> = {
  queued: 0,
  dispatching: 1,
  accepted: 2,
  scheduled: 2,
  sending: 3,
  sent: 4,
  delivered: 5,
  undelivered: 5,
  failed: 5,
  canceled: 5,
};

export function nextSmsState(current: string, incoming: string): string {
  if (!Object.prototype.hasOwnProperty.call(RANK, incoming)) return current;
  return RANK[incoming] > (RANK[current] ?? 99) ? incoming : current;
}

export const STOP_WORDS = /^(STOP|STOPALL|UNSUBSCRIBE|CANCEL|END|QUIT)$/i;
export const START_WORDS = /^(START|YES|UNSTOP)$/i;
