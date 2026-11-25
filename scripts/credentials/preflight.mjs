import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const envPath = resolve(root, process.argv[2] || ".env.production");
const values = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("="); values[line.slice(0, index)] = line.slice(index + 1);
  }
}
const errors = [];
const placeholders = /^(|GENERATE_ME|CHANGE_ME|XXXXXXXXXX|SUPPLY_SECURELY)$/;
for (const key of ["API_URL", "SIGNALING_URL", "WEB_URL", "APNS_KEY_ID", "APNS_TEAM_ID", "APNS_BUNDLE_ID", "TURN_DOMAIN", "TURN_URL", "ANDROID_KEY_ALIAS"]) {
  if (placeholders.test(values[key] || "")) errors.push(`${key} missing or placeholder`);
  if ((values[key] || "").includes(".example")) errors.push(`${key} still uses an example domain`);
}
for (const key of ["JWT_SECRET", "REFRESH_TOKEN_PEPPER", "TURN_SHARED_SECRET", "TOTP_ENCRYPTION_KEY"]) {
  const direct = values[key]; const file = values[`${key}_FILE`];
  const localSecretFiles = {
    JWT_SECRET: "secrets/runtime/jwt-secret.txt",
    REFRESH_TOKEN_PEPPER: "secrets/runtime/refresh-token-pepper.txt",
    TURN_SHARED_SECRET: "secrets/turn/shared-secret.txt",
    TOTP_ENCRYPTION_KEY: "secrets/runtime/totp-encryption-key.txt",
  };
  if ((!direct || direct.length < 32) && (!file || !existsSync(resolve(root, localSecretFiles[key])))) {
    errors.push(`${key} must be a strong value or mounted secret file`);
  }
}
for (const [label, path] of [
  ["APNs .p8 key", "secrets/apple/AuthKey.p8"],
  ["Firebase Admin service account", "secrets/firebase/firebase-service-account.json"],
  ["Android google-services.json", "apps/mobile/android/app/google-services.json"],
  ["Android release keystore", "secrets/android/datebuk-release.keystore"],
  ["Rendered Coturn configuration", "infra/coturn/turnserver.conf"],
]) if (!existsSync(resolve(root, path))) errors.push(`${label} missing at ${path}`);

for (const key of ["TURN_CERT_PATH", "TURN_PRIVATE_KEY_PATH"]) {
  if (!values[key] || !existsSync(values[key])) errors.push(`${key} missing or certificate file does not exist`);
}

const firebasePath = resolve(root, "secrets/firebase/firebase-service-account.json");
if (existsSync(firebasePath)) {
  try {
    const json = JSON.parse(readFileSync(firebasePath, "utf8"));
    for (const field of ["project_id", "private_key", "client_email"]) if (!json[field]) errors.push(`Firebase service account missing ${field}`);
  } catch { errors.push("Firebase service account JSON is invalid"); }
}
for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) { console.error(`FAILED with ${errors.length} error(s)`); process.exit(1); }
console.log("PASSED: production credentials and configuration are present");
