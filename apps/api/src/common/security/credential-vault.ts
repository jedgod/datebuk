import crypto from "crypto";
import { ServiceUnavailableException } from "@nestjs/common";
import { decryptSecret as decryptLegacy } from "./crypto";

/**
 * Credential vault for communications-provider secrets (Twilio Auth Token / API Key secret).
 *
 * Deliberately separate from TOTP_ENCRYPTION_KEY: a leak of one key must not expose the other
 * class of secret, and each can be rotated on its own schedule.
 *
 * - AES-256-GCM (authenticated). The key must be exactly 32 random bytes, base64-encoded
 *   (`openssl rand -base64 32`); it is NOT hashed/stretched from a passphrase.
 * - Versioned: payload is `dcg:v<N>:<iv>.<tag>.<ciphertext>`. The current key is
 *   DCG_ENCRYPTION_KEY at version DCG_ENCRYPTION_KEY_VERSION; older versions stay readable via
 *   DCG_ENCRYPTION_KEY_V<N> until every row has been re-encrypted (see SmsAccountsService.migrate).
 * - Bound to its context via GCM additional-authenticated-data (`<accountId>:<field>`), so a
 *   ciphertext copied onto another row or field fails authentication instead of decrypting.
 * - Legacy payloads (`iv.tag.ct`, no prefix) were written with TOTP_ENCRYPTION_KEY before this
 *   vault existed. They stay decryptable ONLY to be migrated; nothing new is ever written
 *   with that key.
 */

const PREFIX = "dcg:v";

function parseKey(raw: string | undefined, name: string): Buffer {
  const b = Buffer.from((raw ?? "").trim(), "base64");
  if (b.length !== 32) {
    throw new ServiceUnavailableException(`${name} must be 32 random bytes, base64-encoded (openssl rand -base64 32)`);
  }
  return b;
}

export function currentKeyVersion(): number {
  const v = Number(process.env.DCG_ENCRYPTION_KEY_VERSION ?? 1);
  return Number.isInteger(v) && v >= 1 ? v : 1;
}

function keyFor(version: number): Buffer {
  if (version === currentKeyVersion()) return parseKey(process.env.DCG_ENCRYPTION_KEY, "DCG_ENCRYPTION_KEY");
  return parseKey(process.env[`DCG_ENCRYPTION_KEY_V${version}`], `DCG_ENCRYPTION_KEY_V${version}`);
}

export function vaultConfigured(): boolean {
  try {
    parseKey(process.env.DCG_ENCRYPTION_KEY, "DCG_ENCRYPTION_KEY");
    return true;
  } catch {
    return false;
  }
}

/** Encrypt with the CURRENT key. Throws (never falls back to another key) if it isn't configured. */
export function vaultEncrypt(plaintext: string, context: string): { payload: string; version: number } {
  const version = currentKeyVersion();
  const key = keyFor(version);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    payload: `${PREFIX}${version}:${[iv, tag, ct].map((b) => b.toString("base64")).join(".")}`,
    version,
  };
}

/** Which key version wrote this payload (0 = legacy TOTP-key payload). */
export function vaultVersionOf(payload: string): number {
  const m = /^dcg:v(\d+):/.exec(payload);
  return m ? Number(m[1]) : 0;
}

export function vaultDecrypt(payload: string, context: string): string {
  const version = vaultVersionOf(payload);
  if (version === 0) return decryptLegacy(payload); // legacy, migration-only path
  const body = payload.slice(payload.indexOf(":", PREFIX.length) + 1);
  const [ivB64, tagB64, ctB64] = body.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Malformed encrypted credential");
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyFor(version), Buffer.from(ivB64, "base64"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

export const credentialContext = (accountId: string, field: "authToken" | "apiKeySecret") => `twilio:${accountId}:${field}`;

/**
 * A 32-byte subkey derived from the CURRENT vault key (HKDF-SHA256). Only for development
 * fallbacks: anything stored long-term (recipient/consent hashes) must use DCG_HMAC_KEY instead,
 * because a derived key changes whenever the vault key is rotated.
 */
export function vaultDerive(info: string): Buffer {
  const key = keyFor(currentKeyVersion());
  return Buffer.from(crypto.hkdfSync("sha256", key, Buffer.alloc(0), Buffer.from(`datebuk-dcg:${info}`), 32));
}
