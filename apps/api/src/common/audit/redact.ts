// AuditLog.metadata is raw Postgres JSON, exported wholesale via GET /admin/audit/export
// — unlike pino's structured logs (see common/logging/logger.ts), nothing redacted it
// before this. Same sensitive-key list, applied recursively to whatever object a call
// site passes in, so a future `audit.log({ metadata: { user } })` can't accidentally leak
// a password hash or token into an exportable table.
const SENSITIVE_KEYS = new Set([
  "password", "newpassword", "currentpassword", "temppasswordhash",
  "token", "accesstoken", "refreshtoken", "tokenhash", "secret", "backupcodes",
  "authorization", "cookie", "photokey", "photourl",
]);

const MAX_DEPTH = 6;

export function redactMetadata(value: unknown, depth = 0): any {
  if (value == null || depth > MAX_DEPTH) return value;
  if (Array.isArray(value)) return value.map((v) => redactMetadata(v, depth + 1));
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redactMetadata(val, depth + 1);
  }
  return out;
}
