#!/usr/bin/env node
/**
 * Drives the running web (3000) + api (4000) dev servers with playwright-core
 * against the system-installed Chrome (no Playwright browser download needed).
 *
 * Usage:
 *   node driver.mjs signup                          -> creates a test user, prints
 *                                                       auth JSON, writes it to
 *                                                       .auth.json in this directory
 *   node driver.mjs shot <path> [outfile.png]        -> authenticated screenshot of
 *                                                       http://localhost:3000<path>
 *
 * Env overrides: CHROME_PATH, API_URL (default http://localhost:4000),
 * WEB_URL (default http://localhost:3000).
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, ".auth.json");
const CHROME_PATH =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const API_URL = process.env.API_URL || "http://localhost:4000";
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

async function signup() {
  const email = `run-check-${Date.now()}@example.com`;
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "TestPass123", displayName: "Run Check" }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`signup failed: ${res.status} ${JSON.stringify(body)}`);
  fs.writeFileSync(AUTH_FILE, JSON.stringify(body, null, 2));
  console.log(JSON.stringify(body, null, 2));
  return body;
}

async function shot(urlPath, outFile) {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error(`No auth session yet — run \`node driver.mjs signup\` first (looked for ${AUTH_FILE})`);
  }
  const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  // Seeds the same localStorage shape apps/web/src/stores/auth.ts writes, so the app
  // treats us as already logged in before any page script runs.
  await context.addInitScript(
    ({ accessToken, refreshToken, userId }) => {
      localStorage.setItem("datepage.auth.v1", JSON.stringify({ accessToken, refreshToken, userId }));
    },
    { accessToken: auth.accessToken, refreshToken: auth.refreshToken, userId: auth.userId }
  );

  // apps/web/src/proxy.ts's auth gate checks this cookie server-side before /dashboard
  // is allowed through.
  await context.addCookies([
    { name: "dp_access", value: auth.accessToken, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);

  // domcontentloaded, not networkidle: Next's HMR websocket never goes idle in dev
  // mode, so networkidle just times out.
  await page.goto(`${WEB_URL}${urlPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500); // let client-side data fetches settle

  const outPath = outFile
    ? path.resolve(outFile)
    : path.join(__dirname, "screenshots", `${urlPath.replace(/\//g, "_") || "root"}.png`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, fullPage: false });

  await browser.close();
  console.log(JSON.stringify({ screenshot: outPath, consoleErrors }, null, 2));
}

const [, , cmd, arg1, arg2] = process.argv;
try {
  if (cmd === "signup") await signup();
  else if (cmd === "shot") await shot(arg1 || "/dashboard", arg2);
  else {
    console.error("Usage: node driver.mjs signup | node driver.mjs shot <path> [outfile.png]");
    process.exit(1);
  }
} catch (err) {
  console.error("DRIVER FAILED:", err.message || err);
  process.exit(1);
}
