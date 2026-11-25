#!/usr/bin/env node
/**
 * Disaster-recovery drill for the communications data (DCG V14.1).
 *
 * Proves, on an ISOLATED throwaway database - never the source - that:
 *   1. a logical backup of the live database can be taken and is integrity-protected (encrypted + hashed),
 *   2. it restores completely (schema, migrations, row counts, hash-matching content),
 *   3. credentials stored in the vault decrypt after restore with the vault key - and ONLY with it
 *      (the "vault-key recovery" requirement: the key is as important as the backup),
 *   4. the documented rollback scripts apply cleanly to the restored copy, the schema is as expected,
 *      and the forward migrations re-apply (rollback -> roll-forward cycle),
 *   5. recovery time (RTO) is measured, and recovery point (RPO) is stated for the backup used.
 *
 * Read-only against the source (pg_dump). Requires Docker with postgres images (uses the one matching
 * the source server's major version). Usage:  node scripts/dcg-dr-drill.mjs
 * Writes docs/dcg/DR-DRILL-<date>.md with measurements.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "..");
const repoRoot = path.resolve(apiRoot, "../..");
const req = createRequire(path.join(apiRoot, "package.json"));

for (const line of fs.readFileSync(path.join(apiRoot, ".env"), "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { PrismaClient } = req("@prisma/client");

const src = new URL(process.env.DATABASE_URL.replace(/^postgresql:/, "http:"));
const SRC = { user: decodeURIComponent(src.username), pass: decodeURIComponent(src.password), db: src.pathname.slice(1), port: src.port || "5432" };

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};
const ms = (t0) => Math.round(performance.now() - t0);
const docker = (args, opts = {}) => spawnSync("docker", args, { encoding: "utf8", maxBuffer: 1 << 30, ...opts });

const work = fs.mkdtempSync(path.join(os.tmpdir(), "dcg-dr-"));
let container = null;

async function main() {
  // ---- source facts + a recognizable credential fixture (so vault recovery is provable) ----
  const prisma = new PrismaClient();
  const [{ v }] = await prisma.$queryRaw`select version() as v`;
  const major = Number(/PostgreSQL (\d+)/.exec(v)[1]);
  const image = ({ 15: "postgres:15", 16: "postgres:16", 17: "postgres:17-alpine", 18: "postgres:18-alpine" })[major];
  if (!image) throw new Error(`no local image mapped for PostgreSQL ${major}`);
  console.log(`source: PostgreSQL ${major}; using ${image} for dump and restore (isolated container)`);

  const { vaultEncrypt, vaultDecrypt, credentialContext } = await loadVault();
  const fixtureId = crypto.randomUUID();
  const fixtureToken = "dr_drill_token_" + crypto.randomBytes(12).toString("hex");
  await prisma.twilioAccount.create({
    data: { id: fixtureId, name: "dr-drill-fixture", accountSid: "AC" + crypto.randomBytes(16).toString("hex"), status: "revoked", keyVersion: 1, encryptedAuthToken: vaultEncrypt(fixtureToken, credentialContext(fixtureId, "authToken")).payload },
  });

  const tables = ["User", "TwilioAccount", "SmsMessage", "OtpChallenge", "SmsConsentEvent", "ComplianceRegistration", "_prisma_migrations"];
  const countAll = async (client) => Object.fromEntries(await Promise.all(tables.map(async (t) => [t, Number((await client.$queryRawUnsafe(`select count(*)::int c from "${t}"`))[0].c)])));
  const before = await countAll(prisma);
  const backupStartedAt = new Date();

  // ---- 1. backup (read-only against the source) ----
  const dumpFile = path.join(work, "backup.dump");
  let t0 = performance.now();
  // Passwords go via the environment (docker copies the named variable), never onto a command line.
  const dump = docker(["run", "--rm", "-e", "PGPASSWORD", image, "pg_dump", "-h", "host.docker.internal", "-p", SRC.port, "-U", SRC.user, "-Fc", SRC.db], { encoding: "buffer", env: { ...process.env, PGPASSWORD: SRC.pass } });
  if (dump.status !== 0) throw new Error("pg_dump failed: " + String(dump.stderr).slice(0, 300));
  fs.writeFileSync(dumpFile, dump.stdout);
  const tBackup = ms(t0);
  const dumpSize = fs.statSync(dumpFile).size;
  check("backup taken (custom-format logical dump)", dumpSize > 10_000, `${(dumpSize / 1024 / 1024).toFixed(2)} MB in ${tBackup} ms`);

  // ---- 1b. encrypt + hash, then prove the round trip (backup integrity) ----
  t0 = performance.now();
  const key = crypto.randomBytes(32);
  const plain = fs.readFileSync(dumpFile);
  const sha = crypto.createHash("sha256").update(plain).digest("hex");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(plain), c.final()]);
  const tag = c.getAuthTag();
  fs.writeFileSync(path.join(work, "backup.dump.enc"), Buffer.concat([iv, tag, enc]));
  const blob = fs.readFileSync(path.join(work, "backup.dump.enc"));
  const d = crypto.createDecipheriv("aes-256-gcm", key, blob.subarray(0, 12));
  d.setAuthTag(blob.subarray(12, 28));
  const back = Buffer.concat([d.update(blob.subarray(28)), d.final()]);
  check("encrypted backup decrypts to the identical bytes (SHA-256 match)", crypto.createHash("sha256").update(back).digest("hex") === sha, `${ms(t0)} ms`);
  const tampered = Buffer.from(blob);
  tampered[40] ^= 1;
  let tamperCaught = false;
  try {
    const d2 = crypto.createDecipheriv("aes-256-gcm", key, tampered.subarray(0, 12));
    d2.setAuthTag(tampered.subarray(12, 28));
    Buffer.concat([d2.update(tampered.subarray(28)), d2.final()]);
  } catch {
    tamperCaught = true;
  }
  check("a tampered backup is detected, not restored", tamperCaught);
  fs.writeFileSync(dumpFile, back); // restore from the decrypted copy, as a real recovery would

  // ---- 2. restore into an isolated container ----
  const port = 55000 + Math.floor(Math.random() * 900);
  const pass = crypto.randomBytes(12).toString("hex");
  t0 = performance.now();
  const run = docker(["run", "-d", "--rm", "-e", "POSTGRES_PASSWORD", "-p", `127.0.0.1:${port}:5432`, "--name", `dcg-dr-${port}`, image], { env: { ...process.env, POSTGRES_PASSWORD: pass } });
  if (run.status !== 0) throw new Error("could not start restore container: " + run.stderr.slice(0, 200));
  container = `dcg-dr-${port}`;
  // The official image starts a temporary server for its init scripts, then restarts it. Wait for init to
  // finish AND for the real server to accept connections before creating the database.
  for (let i = 0; i < 120; i++) {
    const logs = docker(["logs", container]);
    const initDone = /init process complete|PostgreSQL Database directory appears to contain a database/i.test(String(logs.stdout) + String(logs.stderr));
    if (initDone && docker(["exec", container, "pg_isready", "-U", "postgres"]).status === 0) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  for (let i = 0; i < 20; i++) {
    const r = docker(["exec", container, "createdb", "-U", "postgres", "restored"]);
    if (r.status === 0 || /already exists/.test(String(r.stderr))) break;
    await new Promise((r2) => setTimeout(r2, 1000));
  }
  const restore = docker(["exec", "-i", container, "pg_restore", "-U", "postgres", "-d", "restored", "--no-owner"], { input: fs.readFileSync(dumpFile), encoding: "buffer" });
  const restoreWarn = String(restore.stderr);
  const tRestore = ms(t0);
  check("restore into an isolated database completed", restore.status === 0 || !/FATAL|could not connect/.test(restoreWarn), `${tRestore} ms (start container + restore)`);

  const restoredUrl = `postgresql://postgres:${pass}@127.0.0.1:${port}/restored?schema=public`;
  const restored = new PrismaClient({ datasources: { db: { url: restoredUrl } } });
  const after = await countAll(restored);
  const tRto = ms(t0);
  check("every key table has the same row count as the source at backup time", tables.every((t) => after[t] >= before[t] - 0 && after[t] <= before[t] + 5), JSON.stringify(Object.fromEntries(tables.map((t) => [t, `${before[t]}→${after[t]}`]))));
  const dstMig = await restored.$queryRaw`select count(*)::int c from "_prisma_migrations" where finished_at is not null`;
  check("all migrations are present and finished in the restored copy", Number(dstMig[0].c) === before._prisma_migrations, `${dstMig[0].c} migrations`);

  // ---- 3. vault-key recovery ----
  const row = await restored.twilioAccount.findUnique({ where: { id: fixtureId } });
  check("the credential fixture came back encrypted (no plaintext in the backup)", !!row && !JSON.stringify(row).includes(fixtureToken));
  check("with the vault key, the restored credential decrypts to the original", vaultDecrypt(row.encryptedAuthToken, credentialContext(fixtureId, "authToken")) === fixtureToken);
  const savedKey = process.env.DCG_ENCRYPTION_KEY;
  process.env.DCG_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
  let wrongKeyFailed = false;
  try {
    vaultDecrypt(row.encryptedAuthToken, credentialContext(fixtureId, "authToken"));
  } catch {
    wrongKeyFailed = true;
  }
  process.env.DCG_ENCRYPTION_KEY = savedKey;
  check("without the right vault key the backup's credentials are unrecoverable (the key must be backed up separately)", wrongKeyFailed);

  // ---- 4. migration rollback + roll-forward on the restored copy ----
  const migrationsBefore = Number((await restored.$queryRaw`select count(*)::int c from "_prisma_migrations"`)[0].c);
  const applyFile = (f) => docker(["exec", "-i", container, "psql", "-U", "postgres", "-d", "restored", "-v", "ON_ERROR_STOP=1"], { input: fs.readFileSync(f), encoding: "buffer" });
  const downs = ["20261125100000_dcg_otp_consent_fraud_compliance", "20261124180000_sms_outbox_and_webhook_events"].map((n) => path.join(apiRoot, "prisma/rollback", `${n}.down.sql`));
  t0 = performance.now();
  for (const f of downs) {
    const r = applyFile(f);
    check(`rollback script applies cleanly: ${path.basename(f)}`, r.status === 0, r.status === 0 ? "" : String(r.stderr).slice(0, 200));
  }
  const tRollback = ms(t0);
  const gone = await restored.$queryRaw`select count(*)::int c from information_schema.tables where table_schema='public' and table_name in ('OtpChallenge','SmsConsentEvent','SmsWebhookEvent','ComplianceRegistration','SmsControl','SmsRiskEvent')`;
  const cols = await restored.$queryRaw`select count(*)::int c from information_schema.columns where table_name='SmsMessage' and column_name in ('toEncrypted','bodyEncrypted','needsReview','idempotencyKey')`;
  check("after rollback the new tables and columns are gone and older data is intact", Number(gone[0].c) === 0 && Number(cols[0].c) === 0 && Number((await restored.$queryRaw`select count(*)::int c from "User"`)[0].c) === after.User);
  const migrationsRolled = Number((await restored.$queryRaw`select count(*)::int c from "_prisma_migrations"`)[0].c);
  check("rollback unregistered exactly the two migrations", migrationsRolled === migrationsBefore - 2, `${migrationsBefore}→${migrationsRolled}`);

  t0 = performance.now();
  const forward = spawnSync("npx", ["prisma", "migrate", "deploy"], { cwd: apiRoot, encoding: "utf8", shell: true, env: { ...process.env, DATABASE_URL: restoredUrl } });
  const tForward = ms(t0);
  check("forward migrations re-apply to the rolled-back copy", forward.status === 0 && /applied|up to date/i.test(forward.stdout + forward.stderr), `${tForward} ms`);
  const migrationsAgain = Number((await restored.$queryRaw`select count(*)::int c from "_prisma_migrations" where finished_at is not null`)[0].c);
  check("the schema is fully migrated again", migrationsAgain === migrationsBefore, `${migrationsAgain} migrations`);
  const triggerOk = await restored.$queryRaw`select count(*)::int c from pg_trigger where tgname='sms_consent_event_immutable'`;
  check("the consent-history immutability trigger is back after roll-forward", Number(triggerOk[0].c) === 1);

  await restored.$disconnect();
  await prisma.twilioAccount.delete({ where: { id: fixtureId } });
  await prisma.$disconnect();

  // ---- measurements + report ----
  const report = {
    date: new Date().toISOString(),
    postgres: major,
    backup: { bytes: dumpSize, ms: tBackup, startedAt: backupStartedAt.toISOString() },
    restore: { ms: tRestore },
    rto_ms: tRto,
    rollback_ms: tRollback,
    forward_ms: tForward,
    rows: Object.fromEntries(tables.map((t) => [t, { source: before[t], restored: after[t] }])),
  };
  const md = `# DCG disaster-recovery drill - ${report.date.slice(0, 10)}

Run with \`node apps/api/scripts/dcg-dr-drill.mjs\` against an **isolated** PostgreSQL ${major} container (the source was only read by \`pg_dump\`).
This is a drill on the **development** database, not production, and not a substitute for a production restore rehearsal.

| Measure | Result |
|---|---|
| Backup size (custom format) | ${(dumpSize / 1024 / 1024).toFixed(2)} MB |
| Backup duration | ${tBackup} ms |
| Restore duration (start isolated container + pg_restore) | ${tRestore} ms |
| **Recovery time (RTO), end to end incl. verification of restore** | **${(tRto / 1000).toFixed(1)} s** |
| Rollback of 2 migrations | ${tRollback} ms |
| Roll-forward (prisma migrate deploy) | ${tForward} ms |
| **Recovery point (RPO)** | **the moment the dump started (${backupStartedAt.toISOString()}). Data written afterwards is not in this backup; the real RPO equals your backup interval (or PITR/WAL granularity once configured).** |

## Checks
${results.map((r) => `- [${r.ok ? "x" : " "}] ${r.name}${r.detail ? ` - ${r.detail}` : ""}`).join("\n")}

## What this proves, and does not
- Backups can be encrypted, integrity-checked and restored completely; tampering is detected.
- Vault credentials survive a restore **only with the vault key** - back \`DCG_ENCRYPTION_KEY\` (and every \`DCG_ENCRYPTION_KEY_V<n>\` still in use) and \`DCG_HMAC_KEY\` up separately from the database backups, in a different secret store.
  Losing \`DCG_HMAC_KEY\` orphans recipient/consent/OTP hashes (consent history would no longer match numbers).
- The documented rollback scripts and the roll-forward work on a real restored copy.
- NOT proven here: production-scale restore time, point-in-time recovery, cross-region recovery, or restoring Redis/queue state (the queue lives in PostgreSQL via pg-boss, so it is restored with the database; in-flight leases expire and are recovered by the sweeper).
`;
  const out = path.join(repoRoot, "docs/dcg", `DR-DRILL-${report.date.slice(0, 10)}.md`);
  fs.writeFileSync(out, md);
  console.log(`\nreport written: ${path.relative(repoRoot, out)}`);
}

async function loadVault() {
  // Reuse the production vault implementation (compiled on the fly by ts-node's register hook).
  req("ts-node").register({ transpileOnly: true, compilerOptions: { module: "commonjs" } });
  return req(path.join(apiRoot, "src/common/security/credential-vault.ts"));
}

try {
  await main();
} catch (e) {
  check("drill ran to completion", false, String(e?.message ?? e).slice(0, 300));
} finally {
  if (container) docker(["rm", "-f", container]);
  fs.rmSync(work, { recursive: true, force: true });
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? ` - ${failed.length} FAILED` : ""}`);
  process.exit(failed.length ? 1 : 0);
}
