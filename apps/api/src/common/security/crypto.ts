import crypto from "crypto";
import { requireSecret } from "../../config/environment";

const ALGORITHM = "aes-256-gcm";

function encryptionKey(): Buffer {
  // AES-256-GCM requires exactly a 32-byte key; derive a fixed-length key
  // from the configured secret regardless of the operator-provided string's
  // length via SHA-256, rather than requiring the raw secret be exactly 32
  // bytes itself.
  return crypto.createHash("sha256").update(requireSecret("TOTP_ENCRYPTION_KEY")).digest();
}

/**
 * Reversible (not one-way) encryption for secrets that must be recovered in
 * plaintext to be used later — e.g. a TOTP seed, which the server needs back
 * in full to compute the expected code. Never use this for passwords or
 * anything else that only ever needs to be *compared*, not read back —
 * those belong in hashSecret/verifySecret (bcrypt) instead.
 */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted secret payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
