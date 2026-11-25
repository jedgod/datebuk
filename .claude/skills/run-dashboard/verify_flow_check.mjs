#!/usr/bin/env node
// Ad-hoc audit script: drives the /verification page end-to-end with a fake camera
// device (happy path) and again with camera access denied (denial path).
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const API_URL = process.env.API_URL || "http://localhost:4000";
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

async function signup(tag) {
  const email = `verify-check-${tag}-${Date.now()}@example.com`;
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "TestPass123", displayName: `Verify Check ${tag}` }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`signup failed: ${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function seedAuth(context, auth) {
  await context.addInitScript(
    ({ accessToken, refreshToken, userId }) => {
      localStorage.setItem("datepage.auth.v1", JSON.stringify({ accessToken, refreshToken, userId }));
    },
    { accessToken: auth.accessToken, refreshToken: auth.refreshToken, userId: auth.userId }
  );
  await context.addCookies([
    { name: "dp_access", value: auth.accessToken, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
}

async function happyPath() {
  const auth = await signup("happy");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream", // auto-accept the permission prompt
    ],
  });
  const context = await browser.newContext({ viewport: { width: 1000, height: 800 }, permissions: ["camera"] });
  await seedAuth(context, auth);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  const netFailures = [];
  page.on("requestfailed", (req) => netFailures.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`));
  const apiCalls = [];
  page.on("response", (res) => {
    if (res.url().includes("/verification") || res.url().includes("/uploads")) {
      apiCalls.push(`${res.request().method()} ${res.url()} -> ${res.status()}`);
    }
  });

  await page.goto(`${WEB_URL}/verification`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);
  fs.mkdirSync(path.join(__dirname, "screenshots"), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, "screenshots", "verify_1_intro.png") });

  await page.getByText("Start Verification").click();
  await page.waitForTimeout(1500); // let getUserMedia attach + video element paint a frame
  await page.screenshot({ path: path.join(__dirname, "screenshots", "verify_2_camera.png") });

  await page.getByText("Capture Photo").click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(__dirname, "screenshots", "verify_3_preview.png") });

  await page.getByText("Submit for Review").click();
  await page.waitForTimeout(2500); // upload + submit round trip
  await page.screenshot({ path: path.join(__dirname, "screenshots", "verify_4_pending.png") });

  const bodyText = await page.textContent("body");
  const reachedPending = bodyText.includes("Under Review");

  await browser.close();

  // Confirm the backend actually recorded it (not just a client-side optimistic state).
  const statusRes = await fetch(`${API_URL}/api/verification/status`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  const statusBody = await statusRes.json();

  return { reachedPending, consoleErrors, netFailures, apiCalls, backendStatus: statusBody, userId: auth.userId };
}

async function denialPath() {
  const auth = await signup("denied");
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    // Deterministically auto-DENY the getUserMedia permission prompt (Chromium-specific
    // flag suffix), rather than leaving it unresolved in headless mode with no UI to
    // click through.
    args: ["--no-sandbox", "--disable-gpu", "--use-fake-ui-for-media-stream=deny"],
  });
  const context = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await seedAuth(context, auth);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(`${WEB_URL}/verification`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.getByText("Start Verification").click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, "screenshots", "verify_5_denied.png") });

  const bodyText = await page.textContent("body");
  const showedDenialMessage = bodyText.includes("Camera access was denied");
  const stillOnIntro = bodyText.includes("Start Verification");

  await browser.close();
  return { showedDenialMessage, stillOnIntro, consoleErrors };
}

const which = process.argv[2] || "both";
(async () => {
  if (which === "happy" || which === "both") {
    console.log("=== HAPPY PATH ===");
    console.log(JSON.stringify(await happyPath(), null, 2));
  }
  if (which === "denial" || which === "both") {
    console.log("=== DENIAL PATH ===");
    console.log(JSON.stringify(await denialPath(), null, 2));
  }
})().catch((err) => {
  console.error("SCRIPT FAILED:", err.message || err);
  process.exit(1);
});
