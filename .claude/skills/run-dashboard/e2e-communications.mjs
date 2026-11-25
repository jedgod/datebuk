#!/usr/bin/env node
/**
 * Browser certification of the Communications Center against the REAL stack (web :3000 + api :4000 +
 * the dev PostgreSQL), driven in Chrome with playwright-core.
 *
 * Authentication is never bypassed: every account signs in through the real login pages, the real
 * OTP screen and a real TOTP code generated from a genuinely enrolled authenticator secret, and every
 * management action goes through the real MFA step-up prompt. Fixture accounts are created directly
 * in the database (a test fixture, like seeding) and their MFA is enrolled through the real API.
 *
 * Twilio is NEVER given real credentials: registration/sender calls use fake credentials, which the
 * provider rejects - proving the UI -> step-up -> API -> provider-validation chain without any
 * charge or message. No SMS is sent. This is a SIMULATED-PROVIDER result, not live certification.
 *
 *   MSYS_NO_PATHCONV=1 node e2e-communications.mjs
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "../../../apps/api");
const req = createRequire(path.join(apiRoot, "package.json"));
// Minimal .env loader (the API's own file), so the fixture setup sees the same DATABASE_URL / JWT_SECRET.
for (const line of fs.readFileSync(path.join(apiRoot, ".env"), "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { PrismaClient } = req("@prisma/client");
const bcrypt = req("bcrypt");
const speakeasy = req("speakeasy");
const { JwtService } = req("@nestjs/jwt");

const WEB = process.env.WEB_URL || "http://localhost:3000"; // customer app
const PORTAL = process.env.PORTAL_URL || "http://localhost:3010"; // admin/staff portal (apps/web dev:portal)
const API = process.env.API_URL || "http://localhost:4000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = path.join(here, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

const prisma = new PrismaClient();
const results = [];
const consoleErrors = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};
const totp = (secret) => speakeasy.totp({ secret, encoding: "base32" });
const tag = Date.now().toString(36);
const created = { users: [], accounts: [] };

async function mkUser(role, label) {
  const email = `e2e-${label}-${tag}@example.com`;
  const password = "E2e!Passw0rd-" + tag;
  const u = await prisma.user.create({ data: { email, password: await bcrypt.hash(password, 12), role, emailVerified: true, accountStatus: "ACTIVE", displayName: label } });
  created.users.push(u.id);
  return { id: u.id, email, password };
}

/** Real MFA enrolment through the real API (the same calls the setup-mfa page makes). */
async function enrollMfa(user) {
  const j = (r) => r.json();
  const login = await j(await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, password: user.password }) }));
  if (!login.mustSetupMfa) throw new Error("expected forced MFA setup for " + user.email);
  const setup = await j(await fetch(`${API}/api/auth/mfa/setup`, { method: "POST", headers: { "Content-Type": "application/json", "x-temp-token": login.tempToken } }));
  await j(await fetch(`${API}/api/auth/mfa/setup/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-temp-token": login.tempToken },
    body: JSON.stringify({ secret: setup.secret, otpToken: totp(setup.secret), backupCodes: Array.from({ length: 8 }, (_, i) => `bk${i}-${tag}-${i}${i}${i}${i}`) }),
  }));
  user.secret = setup.secret;
}

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(90_000);
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/webpack-hmr|Failed to load resource|favicon|Download the React DevTools/.test(m.text())) consoleErrors.push(m.text().slice(0, 160));
  });
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, `e2e-${name}.png`), fullPage: true });

/** Wait until React has hydrated the page (dev builds compile on first visit; clicking earlier submits the form natively). */
const hydrated = (page, sel = "input") =>
  page.waitForFunction((q) => { const el = document.querySelector(q); return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps") || k.startsWith("__reactFiber")); }, sel, { timeout: 90_000 });

async function loginViaOtp(page, loginUrl, user, { emailSel, passSel }) {
  await page.goto(`${PORTAL}${loginUrl}`, { waitUntil: "domcontentloaded" });
  await hydrated(page, emailSel);
  await page.fill(emailSel, user.email);
  await page.fill(passSel, user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/auth\/verify-otp/, { timeout: 90_000 });
  await hydrated(page, 'input[type="text"]');
  await page.fill('input[type="text"]', totp(user.secret));
  await page.click('button[type="submit"]');
}

async function stepUp(page, secret) {
  await page.waitForSelector("text=Confirm it's you");
  await page.fill('input[placeholder="123456"]', totp(secret));
  await page.click("button:has-text('Confirm')");
}

async function main() {
  // sanity: stack is up
  for (const [n, u] of [["web", WEB], ["portal", `${PORTAL}/access-denied`], ["api", `${API}/api/health`]]) {
    const r = await fetch(u).catch(() => null);
    if (!r) throw new Error(`${n} not reachable at ${u}`);
  }

  const sup = await mkUser("SUPERADMIN", "super");
  const staff = await mkUser("SUPPORT", "staff");
  const cust = await mkUser("USER", "cust");
  await enrollMfa(sup);
  await enrollMfa(staff);

  // a provider account fixture (verified, with a sender), so spending controls have something to act on
  const acctId = (await import("node:crypto")).randomUUID();
  await prisma.twilioAccount.create({
    data: { id: acctId, name: `e2e-account-${tag}`, accountSid: "AC" + "e2".repeat(16), status: "verified", keyVersion: 1, apiKeySid: "SK" + "e2".repeat(16), encryptedApiKeySecret: "dcg:v1:fixture", senders: { create: { senderNumber: "+14155550100" } } },
  });
  created.accounts.push(acctId);

  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try {
    // ====================================================================== unauthenticated + customer
    {
      const { ctx, page } = await newPage(browser);
      await page.goto(`${PORTAL}/admin/communications`, { waitUntil: "domcontentloaded" });
      await page.waitForURL(/\/admin\/login/);
      check("unauthenticated visitor is sent to the admin login", /\/admin\/login/.test(page.url()));
      await shot(page, "01-admin-login");
      await ctx.close();
    }
    {
      const { ctx, page } = await newPage(browser);
      await page.goto(`${WEB}/login`, { waitUntil: "domcontentloaded" });
      await hydrated(page, 'input[type="password"]');
      await page.fill('input[type="email"]', cust.email).catch(async () => page.fill('input', cust.email));
      await page.fill('input[type="password"]', cust.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
      const custToken = await page.evaluate(() => JSON.parse(localStorage.getItem("datepage.auth.v1") || "{}").accessToken);
      await page.goto(`${WEB}/admin/communications`, { waitUntil: "domcontentloaded" }); // proxied to the portal
      await page.waitForURL(/access-denied|\/admin\/login|\/login/, { timeout: 60_000 });
      check("an ordinary customer cannot open the admin Communications Center", !/\/admin\/communications/.test(page.url()), page.url().replace(WEB, "").replace(PORTAL, ""));
      const apiStatus = (await fetch(`${API}/api/admin/sms/accounts`, { headers: { Authorization: `Bearer ${custToken}` } })).status;
      check("...and the API independently refuses the customer (403)", !!custToken && apiStatus === 403, `status ${apiStatus}`);
      await ctx.close();
    }

    // ====================================================================== superadmin (real MFA)
    {
      const { ctx, page } = await newPage(browser);
      await loginViaOtp(page, "/admin/login?next=/admin/communications", sup, { emailSel: 'input[type="email"]', passSel: 'input[type="password"]' });
      await page.waitForURL(/\/admin\/communications/, { timeout: 120_000 });
      check("superadmin signs in through the real login + OTP screen and lands on the Communications Center", /\/admin\/communications/.test(page.url()));
      await page.waitForSelector("text=Communications Center");
      const cookies = await ctx.cookies();
      const adminCookie = cookies.find((c) => c.name === "dp_admin");
      check("role cookies are server-set and httpOnly (page scripts cannot forge them)", adminCookie?.httpOnly === true && adminCookie?.value === "1");
      await shot(page, "02-superadmin-overview");

      // ---- provider accounts tab
      await page.click("button:has-text('Provider accounts')");
      await page.waitForSelector(`text=e2e-account-${tag}`);
      check("provider accounts load from the real API", await page.isVisible(`text=e2e-account-${tag}`));
      check("admin sees management controls", await page.isVisible("button:has-text('Register Twilio account')"));
      check("no credential material is rendered anywhere on the page", !/dcg:v1|encrypted|tok_/.test(await page.content()));
      await shot(page, "03-superadmin-accounts");

      // ---- register -> MFA step-up -> provider validation (fake creds => rejected)
      await page.click("button:has-text('Register Twilio account')");
      await page.fill('input[placeholder^="Name"]', "e2e fake");
      await page.fill('input[placeholder^="Account SID"]', "AC" + "a".repeat(32));
      await page.fill('input[placeholder^="Auth Token"]', "t".repeat(32));
      await page.click("button:has-text('Validate & register')");
      await page.waitForSelector("text=Confirm it's you");
      check("a management action asks for MFA step-up first", true);
      await shot(page, "04-step-up-prompt");
      await page.fill('input[placeholder="123456"]', "000000");
      await page.click("button:has-text('Confirm')");
      await page.waitForSelector("text=isn't valid");
      check("a wrong step-up code is rejected in the UI", true);
      await page.fill('input[placeholder="123456"]', totp(sup.secret));
      await page.click("button:has-text('Confirm')");
      await page.waitForSelector("text=Twilio rejected these credentials");
      check("with a correct code the request reaches provider validation, and fake credentials are refused", true);
      await shot(page, "05-registration-rejected");
      await page.click("button:has-text('Cancel')").catch(() => undefined);

      // ---- spending controls (step-up now cached)
      await page.click("button:has-text('Spending & destinations')");
      await page.waitForSelector("text=Daily segment limit");
      await page.fill('label:has-text("Daily segment limit") + input', "50");
      await page.fill('label:has-text("Monthly segment limit") + input', "900");
      await page.click("button:has-text('Save')");
      await page.waitForSelector("text=Spending controls saved");
      await page.waitForSelector("text=/ 50");
      check("spending controls save and show on the account (within the cached step-up window)", true);
      const row = await prisma.twilioAccount.findUnique({ where: { id: acctId } });
      check("...and are persisted in the database", row?.dailySegmentLimit === 50 && row?.monthlySegmentLimit === 900);
      await shot(page, "06-spending-saved");

      // ---- sender registration with a fake number is refused by the provider check
      await page.click("button:has-text('Add sender')");
      await page.fill('input[placeholder="+14155550123"]', "+14155550123");
      await page.click("button:has-text('Verify & add')");
      await page.waitForSelector("text=/Twilio|credentials|isn't|doesn't|rejected|owned/i");
      check("a sender the account doesn't own is refused", true);
      await page.click("button:has-text('Cancel')").catch(() => undefined);

      // ---- expired step-up: the server refuses, the UI asks again
      const expired = new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: sup.id, temp: true, purpose: "step-up" }, { expiresIn: -60 });
      let swapped = false;
      await page.route("**/api/admin/sms/accounts/*/spending", async (route) => {
        if (swapped) return route.continue();
        swapped = true;
        return route.continue({ headers: { ...route.request().headers(), "x-step-up-token": expired } });
      });
      await page.click("button:has-text('Spending & destinations')");
      await page.waitForSelector("text=Daily segment limit");
      await page.fill('label:has-text("Daily segment limit") + input', "60");
      await page.click("button:has-text('Save')");
      await page.waitForSelector("text=Confirm it's you"); // server said STEP_UP_REQUIRED for the expired token
      check("an expired step-up token is refused by the server and the UI re-prompts for MFA", true);
      await stepUp(page, sup.secret).catch(() => undefined);
      await page.waitForSelector("text=Spending controls saved");
      check("after re-confirming, the action completes", true);
      await page.unroute("**/api/admin/sms/accounts/*/spending");

      // ---- health & emergency stop
      await page.click("button:has-text('Health & alerts')");
      await page.waitForSelector("text=Spending today");
      check("health, queue and spending panels load from the real API", await page.isVisible("text=Queued (due now)"));
      await shot(page, "07-health");
      page.once("dialog", (d) => d.accept("e2e drill"));
      await page.click("button:has-text('EMERGENCY STOP')");
      await page.waitForSelector("text=Emergency stop is ON");
      check("emergency stop engages from the dashboard and is shown prominently", true);
      await shot(page, "08-emergency-stop");
      const ctl = await prisma.smsControl.findUnique({ where: { key: "emergency_stop" } });
      check("...and is recorded in the database", ctl?.value === "on" && ctl?.reason === "e2e drill");
      await page.click("button:has-text('Release emergency stop')");
      await page.waitForSelector("text=Emergency stop is ON", { state: "detached" });
      check("it can be released", (await prisma.smsControl.findUnique({ where: { key: "emergency_stop" } }))?.value === "off");

      // ---- compliance
      await page.click("button:has-text('Compliance')");
      await page.waitForSelector("text=A2P 10DLC");
      await page.selectOption("select >> nth=0", acctId);
      await page.click("button:has-text('Record registration')");
      await page.waitForSelector("text=Registration recorded");
      await page.click("button:has-text('Approve…')");
      check("approving a registration asks for an evidence reference", await page.isVisible("text=Record approval"));
      check("the Record approval button is disabled without evidence", await page.isDisabled("button:has-text('Record approval')"));
      await page.fill("textarea", "Twilio console: brand BN-E2E approved (e2e drill)");
      await page.click("button:has-text('Record approval')");
      await page.waitForSelector("text=Approval recorded");
      const reg = await prisma.complianceRegistration.findFirst({ where: { accountId: acctId } });
      check("approval is stored with its evidence note and the approver", reg?.status === "approved" && /e2e drill/.test(reg?.evidenceNote ?? "") && reg?.decidedBy === sup.id);
      await shot(page, "09-compliance");

      // ---- audit
      await page.click("button:has-text('Audit')");
      await page.waitForSelector("text=STEP_UP_GRANTED");
      const html = await page.content();
      check("the audit trail shows step-up, spending, emergency-stop and compliance actions", ["STEP_UP_GRANTED", "SMS_ACCOUNT_SPENDING_UPDATED", "SMS_EMERGENCY_STOP_ON", "SMS_COMPLIANCE_STATUS"].every((a) => html.includes(a)));
      await shot(page, "10-audit");
      await ctx.close();
    }

    // ====================================================================== staff (read-only)
    {
      const { ctx, page } = await newPage(browser);
      await loginViaOtp(page, "/staff-login?next=/staff/communications", staff, { emailSel: "#email", passSel: 'input[type="password"]' });
      await page.waitForURL(/\/staff\/communications/, { timeout: 120_000 });
      await page.waitForSelector("text=Communications Operations");
      check("staff sign in through real MFA and reach Communications Operations", true);
      await page.click("button:has-text('Provider accounts')");
      await page.waitForSelector(`text=e2e-account-${tag}`);
      check("staff can read provider accounts", true);
      check("staff see NO management controls", !(await page.isVisible("button:has-text('Register Twilio account')")) && !(await page.isVisible("button:has-text('Activate')")) && !(await page.isVisible("button:has-text('Revoke')")));
      await page.click("button:has-text('Health & alerts')");
      await page.waitForSelector("text=Spending today");
      check("staff cannot see the emergency-stop control", !(await page.isVisible("button:has-text('EMERGENCY STOP')")));
      await page.click("button:has-text('Fraud & consent')");
      await page.fill('input[placeholder="+14155550123"]', "+14155550123");
      await page.click("button:has-text('Look up')");
      await page.waitForSelector("text=Current state");
      const body = (await page.textContent("body")) ?? "";
      // The typed number lives in the input's value (not page text); the rendered results must show only the last four digits.
      check("consent lookup shows masked history only: the full number never appears in the rendered page", !body.includes("+14155550123"), `full number in page text: ${body.includes("+14155550123")}`);
      await shot(page, "11-staff-fraud-consent");
      const status = await page.evaluate(async (api) => {
        const raw = JSON.parse(localStorage.getItem("datepage.auth.v1") || "{}");
        const post = (p, b) => fetch(`${api}/api/admin/sms/${p}`, { method: "POST", headers: { Authorization: `Bearer ${raw.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.status);
        return { stop: await post("emergency-stop", { on: true, reason: "x" }), register: await post("accounts", {}), read: await fetch(`${api}/api/admin/sms/health`, { headers: { Authorization: `Bearer ${raw.accessToken}` } }).then((r) => r.status) };
      }, API);
      check("the API refuses staff management calls (403) even from their own signed-in browser, but allows reads", status.stop === 403 && status.register === 403 && status.read === 200, JSON.stringify(status));
      await page.goto(`${PORTAL}/admin/communications`, { waitUntil: "domcontentloaded" });
      await page.waitForURL(/access-denied|login/, { timeout: 60_000 }).catch(() => undefined);
      check("staff cannot open the admin page", !/\/admin\/communications/.test(page.url()), page.url().replace(WEB, ""));
      await shot(page, "12-staff-denied-admin");
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

try {
  await main();
} catch (e) {
  check("suite ran to completion", false, String(e?.message ?? e).slice(0, 300));
} finally {
  await prisma.twilioAccount.deleteMany({ where: { id: { in: created.accounts } } }).catch(() => undefined);
  await prisma.smsControl.upsert({ where: { key: "emergency_stop" }, update: { value: "off", reason: null }, create: { key: "emergency_stop", value: "off" } }).catch(() => undefined);
  await prisma.session.deleteMany({ where: { userId: { in: created.users } } }).catch(() => undefined);
  await prisma.user.deleteMany({ where: { id: { in: created.users } } }).catch((e) => console.log("cleanup note:", String(e.message).slice(0, 100)));
  await prisma.$disconnect();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? ` - ${failed.length} FAILED` : ""}`);
  console.log(`console errors captured: ${consoleErrors.length}`);
  for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.log("  ·", e);
  fs.writeFileSync(path.join(SHOTS, "e2e-communications-results.json"), JSON.stringify({ at: new Date().toISOString(), results, consoleErrors: [...new Set(consoleErrors)], note: "Simulated provider: fake Twilio credentials only; no SMS sent; not live certification." }, null, 2));
  process.exit(failed.length ? 1 : 0);
}
