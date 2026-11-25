import crypto from "crypto";
import { ServiceUnavailableException } from "@nestjs/common";
import { vaultDerive } from "../common/security/credential-vault";

/**
 * Keyed hashing for communications data that must be matchable but never readable: recipient
 * phone numbers (consent, OTP), IP addresses and device ids (fraud velocity), and OTP codes.
 *
 * Root key: DCG_HMAC_KEY (32 random bytes, base64) - separate from the encryption key so that
 * rotating the vault key does not orphan every stored hash. In development, if it is unset, a
 * subkey is derived from the vault key instead. Production requires DCG_HMAC_KEY (validated at boot).
 *
 * Each purpose gets its own subkey (HMAC(root, purpose)), so a hash of a phone number is useless
 * as an IP hash, and a recipient hash can't be replayed as an OTP code.
 */
function rootKey(): Buffer {
  const raw = (process.env.DCG_HMAC_KEY ?? "").trim();
  if (raw) {
    const b = Buffer.from(raw, "base64");
    if (b.length !== 32) throw new ServiceUnavailableException("DCG_HMAC_KEY must be 32 random bytes, base64-encoded");
    return b;
  }
  if (process.env.NODE_ENV === "production") throw new ServiceUnavailableException("DCG_HMAC_KEY is not configured");
  return vaultDerive("hmac-root");
}

const hmac = (purpose: string, value: string) =>
  crypto.createHmac("sha256", crypto.createHmac("sha256", rootKey()).update(`purpose:${purpose}`).digest()).update(value).digest("hex");

export const recipientHash = (e164: string) => hmac("recipient", e164);
export const ipHash = (ip: string) => hmac("ip", ip);
export const deviceHash = (deviceId: string) => hmac("device", deviceId);

/** HMAC of an OTP, bound to the challenge, purpose, recipient and user it was issued for. */
export const otpCodeHmac = (p: { challengeId: string; purpose: string; recipientHash: string; userId: string | null; code: string }) =>
  hmac("otp", [p.challengeId, p.purpose, p.recipientHash, p.userId ?? "", p.code].join("|"));

export const safeEqualHex = (a: string, b: string) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
