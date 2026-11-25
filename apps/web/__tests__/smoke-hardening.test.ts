import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const joined = (...parts: string[]) => parts.join("");

describe("security and product smoke checks", () => {
  it("login route does not contain mock admin fallback or raw body logging", () => {
    const source = read("src/app/api/auth/login/route.ts");
    expect(source).not.toContain(joined("mock", "-admin-token"));
    expect(source).not.toContain(joined("mock", "Admins"));
    expect(source).not.toContain(joined("Raw request", " body"));
    expect(source).toContain("backendRes");
  });

  it("server auth verifies JWTs and has no fallback user id", () => {
    const source = read("src/lib/server/auth.ts");
    expect(source).toContain("timingSafeEqual");
    expect(source).toContain("verifyJwtAndGetUserId");
    expect(source).not.toContain(joined("FALLBACK", "_USER_ID"));
  });

  it("subscription gating cannot be bypassed by request plan overrides", () => {
    const source = read("src/lib/server/subscription-access.ts");
    expect(source).not.toContain(joined("x", "-plan"));
    expect(source).not.toContain(joined("dp", "_plan"));
  });

  it("stripe checkout requires authentication and server allow-listed prices", () => {
    const source = read("src/app/api/stripe/checkout/route.ts");
    expect(source).toContain("getAuthContext");
    expect(source).toContain("STRIPE_ALLOWED_PRICE_IDS");
    expect(source).toContain("client_reference_id");
  });

  it("date requests, feedback, and safety controls have API routes", () => {
    expect(read("src/app/api/date-requests/route.ts")).toContain("completed");
    expect(read("src/app/api/date-feedback/route.ts")).toContain("createDateFeedback");
    expect(read("src/app/api/safety/blocks/route.ts")).toContain("addBlockedMember");
    expect(read("src/app/api/safety/privacy/route.ts")).toContain("savePrivacySettings");
    expect(read("src/app/api/safety/verification/route.ts")).toContain("upsertVerification");
  });

  it("dashboard and premium date planner routes remain protected/gated", () => {
    const proxy = read("src/proxy.ts");
    const advancedPage = read("src/app/dashboard/advanced/[slug]/page.tsx");
    expect(proxy).toContain("/dashboard/:path*");
    expect(advancedPage).toContain("hasAccess(\"premium\")");
    expect(advancedPage).toContain("DatePlannerRequestPanel");
  });
});
