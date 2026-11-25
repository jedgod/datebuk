const LOCAL_URL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
import { existsSync, readFileSync } from "fs";

function required(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function secret(env: Record<string, unknown>, name: string): string | undefined {
  const direct = typeof env[name] === "string" ? String(env[name]).trim() : "";
  if (direct) return direct;
  const file = typeof env[`${name}_FILE`] === "string" ? String(env[`${name}_FILE`]).trim() : "";
  if (!file) return undefined;
  if (!existsSync(file)) throw new Error(`${name}_FILE does not exist: ${file}`);
  const value = readFileSync(file, "utf8").trim();
  if (!value) throw new Error(`${name}_FILE is empty`);
  process.env[name] = value;
  return value;
}

function url(value: unknown, name: string, fallback: string): string {
  const raw = typeof value === "string" && value.trim() ? value.trim() : fallback;
  try {
    new URL(raw);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  return raw.replace(/\/$/, "");
}

export function validateEnvironment(env: Record<string, unknown>) {
  const production = env.NODE_ENV === "production";

  if (production) {
    const jwtSecret = secret(env, "JWT_SECRET");
    const refreshPepper = secret(env, "REFRESH_TOKEN_PEPPER");
    const turnSecret = secret(env, "TURN_SHARED_SECRET");
    const signalingInternalKey = secret(env, "SIGNALING_INTERNAL_KEY");
    const totpEncryptionKey = secret(env, "TOTP_ENCRYPTION_KEY");
    required(env.DATABASE_URL, "DATABASE_URL");
    required(jwtSecret, "JWT_SECRET");
    required(refreshPepper, "REFRESH_TOKEN_PEPPER");
    required(turnSecret, "TURN_SHARED_SECRET");
    required(signalingInternalKey, "SIGNALING_INTERNAL_KEY");
    required(totpEncryptionKey, "TOTP_ENCRYPTION_KEY");
    required(env.S3_REGION, "S3_REGION");
    required(env.S3_BUCKET, "S3_BUCKET");
    for (const name of ["APNS_KEY_PATH", "APNS_KEY_ID", "APNS_TEAM_ID", "APNS_BUNDLE_ID", "FIREBASE_SERVICE_ACCOUNT_PATH", "TURN_DOMAIN", "TURN_URL"]) required(env[name], name);
    for (const pathName of ["APNS_KEY_PATH", "FIREBASE_SERVICE_ACCOUNT_PATH"]) {
      if (!existsSync(String(env[pathName]))) throw new Error(`${pathName} does not exist`);
    }
    // ID verification: real OCR/face match (AWS) and the SMS link (Twilio) are mandatory in production.
    if (String(env.IDENTITY_PROVIDER || "aws").toLowerCase() === "mock") throw new Error("IDENTITY_PROVIDER=mock is not allowed in production");
    // Twilio credentials may live in the database (admin-registered, encrypted) or in env; SmsService
    // returns 503 at send time when neither is configured, so env alone is not required here.
    // Communications: when enabled, the credential vault needs its own key, distinct from TOTP's.
    if (String(env.DCG_ENABLED || "").toLowerCase() === "true") {
      const vault = Buffer.from(String(env.DCG_ENCRYPTION_KEY || "").trim(), "base64");
      if (vault.length !== 32) throw new Error("DCG_ENCRYPTION_KEY must be 32 random bytes, base64-encoded (openssl rand -base64 32)");
      if (String(env.DCG_ENCRYPTION_KEY).trim() === String(env.TOTP_ENCRYPTION_KEY || "").trim()) {
        throw new Error("DCG_ENCRYPTION_KEY must differ from TOTP_ENCRYPTION_KEY");
      }
      if (String(env.DCG_WEBHOOK_SIGNATURE_REQUIRED || "true").toLowerCase() === "false") {
        throw new Error("DCG_WEBHOOK_SIGNATURE_REQUIRED cannot be false in production");
      }
    }
    if (jwtSecret!.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
    if (refreshPepper!.length < 32) throw new Error("REFRESH_TOKEN_PEPPER must be at least 32 characters");
    if (turnSecret!.length < 32) throw new Error("TURN_SHARED_SECRET must be at least 32 characters");
    if (signalingInternalKey!.length < 32) throw new Error("SIGNALING_INTERNAL_KEY must be at least 32 characters");
    if (totpEncryptionKey!.length < 32) throw new Error("TOTP_ENCRYPTION_KEY must be at least 32 characters");
  }

  const webUrl = url(env.WEB_URL, "WEB_URL", "http://localhost:3000");
  if (production && LOCAL_URL.test(webUrl)) throw new Error("WEB_URL cannot use localhost in production");

  return {
    ...env,
    WEB_URL: webUrl,
    API_URL: url(env.API_URL, "API_URL", "http://localhost:4000"),
    SIGNALING_URL: url(env.SIGNALING_URL, "SIGNALING_URL", "http://localhost:4001"),
    PORT: String(env.PORT || "4000"),
  };
}

export function requireSecret(
  name: "JWT_SECRET" | "REFRESH_TOKEN_PEPPER" | "TOTP_ENCRYPTION_KEY",
): string {
  return required(process.env[name], name);
}
