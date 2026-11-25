import crypto from "crypto";
import { requireSecret } from "../../config/environment";

function pepper(): string {
  return requireSecret("REFRESH_TOKEN_PEPPER");
}

export function hashRefreshSecret(secret: string): string {
  // Fast, constant-time comparable hash for refresh secrets.
  // HMAC ensures secrets are not vulnerable to rainbow-table if DB leaks.
  return crypto.createHmac("sha256", pepper()).update(secret).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
