import crypto from "crypto";
import { encryptSecret } from "./crypto";
import { credentialContext, currentKeyVersion, vaultConfigured, vaultDecrypt, vaultEncrypt, vaultVersionOf } from "./credential-vault";

const key = () => crypto.randomBytes(32).toString("base64");
const ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ENV, TOTP_ENCRYPTION_KEY: "legacy-totp-secret-for-tests-0123456789", DCG_ENCRYPTION_KEY: key(), DCG_ENCRYPTION_KEY_VERSION: "1" };
});
afterAll(() => {
  process.env = ENV;
});

const ctx = credentialContext("acct-1", "authToken");

describe("credential vault", () => {
  it("round-trips and tags the payload with the key version", () => {
    const { payload, version } = vaultEncrypt("super-secret-token", ctx);
    expect(version).toBe(1);
    expect(payload.startsWith("dcg:v1:")).toBe(true);
    expect(payload).not.toContain("super-secret-token");
    expect(vaultDecrypt(payload, ctx)).toBe("super-secret-token");
  });

  it("uses a fresh IV every time", () => {
    expect(vaultEncrypt("x", ctx).payload).not.toBe(vaultEncrypt("x", ctx).payload);
  });

  it("binds ciphertext to its account and field (copying it elsewhere fails)", () => {
    const { payload } = vaultEncrypt("token", ctx);
    expect(() => vaultDecrypt(payload, credentialContext("acct-2", "authToken"))).toThrow();
    expect(() => vaultDecrypt(payload, credentialContext("acct-1", "apiKeySecret"))).toThrow();
  });

  it("detects tampering", () => {
    const { payload } = vaultEncrypt("token", ctx);
    const [head, rest] = [payload.slice(0, payload.indexOf(":", 6) + 1), payload.slice(payload.indexOf(":", 6) + 1)];
    const [iv, tag, ct] = rest.split(".");
    const flipped = Buffer.from(ct, "base64");
    flipped[0] ^= 1;
    expect(() => vaultDecrypt(`${head}${iv}.${tag}.${flipped.toString("base64")}`, ctx)).toThrow();
  });

  it("never writes with the TOTP key: no DCG key means encryption fails, not falls back", () => {
    delete process.env.DCG_ENCRYPTION_KEY;
    expect(vaultConfigured()).toBe(false);
    expect(() => vaultEncrypt("token", ctx)).toThrow(/DCG_ENCRYPTION_KEY/);
  });

  it("requires exactly 32 bytes (a passphrase is rejected, not stretched)", () => {
    process.env.DCG_ENCRYPTION_KEY = "a-short-passphrase";
    expect(vaultConfigured()).toBe(false);
    expect(() => vaultEncrypt("token", ctx)).toThrow();
  });

  it("rotation: old payloads stay readable via DCG_ENCRYPTION_KEY_V<n> until re-encrypted", () => {
    const v1 = vaultEncrypt("token", ctx).payload;
    const oldKey = process.env.DCG_ENCRYPTION_KEY!;
    process.env.DCG_ENCRYPTION_KEY = key();
    process.env.DCG_ENCRYPTION_KEY_VERSION = "2";
    expect(currentKeyVersion()).toBe(2);
    expect(() => vaultDecrypt(v1, ctx)).toThrow(); // old key not provided yet
    process.env.DCG_ENCRYPTION_KEY_V1 = oldKey;
    expect(vaultDecrypt(v1, ctx)).toBe("token");
    const v2 = vaultEncrypt(vaultDecrypt(v1, ctx), ctx);
    expect(v2.version).toBe(2);
    expect(vaultVersionOf(v2.payload)).toBe(2);
    delete process.env.DCG_ENCRYPTION_KEY_V1; // old key retired after migration
    expect(vaultDecrypt(v2.payload, ctx)).toBe("token");
  });

  it("legacy TOTP-key payloads are readable for migration only, and report version 0", () => {
    const legacy = encryptSecret("old-twilio-token");
    expect(vaultVersionOf(legacy)).toBe(0);
    expect(vaultDecrypt(legacy, ctx)).toBe("old-twilio-token");
    // migration re-encrypts under the dedicated key, which does not depend on the TOTP key
    const migrated = vaultEncrypt(vaultDecrypt(legacy, ctx), ctx).payload;
    process.env.TOTP_ENCRYPTION_KEY = "a-completely-different-totp-secret-9876543210";
    expect(vaultDecrypt(migrated, ctx)).toBe("old-twilio-token");
  });
});
