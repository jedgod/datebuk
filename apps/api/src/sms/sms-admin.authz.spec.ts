import "reflect-metadata";

// pg-boss is ESM-only and irrelevant to guard behaviour; stub it so AuthService can be imported.
jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));

import { GUARDS_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ForbiddenException, ServiceUnavailableException } from "@nestjs/common";
import { SmsAdminController } from "./sms-admin.controller";
import { DcgEnabledGuard } from "./dcg-enabled.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { StepUpGuard } from "../auth/step-up.guard";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AuthService } from "../auth/auth.service";

/**
 * Access matrix for provider administration, executed through the REAL guard classes in the
 * same order Nest runs them (class-level guards, then method-level), against the real
 * role -> permission table and real JWT step-up verification. Only the database lookup of a
 * user's role and the (separately tested) JwtAuthGuard session check are stubbed.
 */
const SECRET = "test-secret-test-secret-test-secret-123";
const jwt = new JwtService({ secret: SECRET });

type Who = { id: string; role: "USER" | "SUPPORT" | "SUPERADMIN" };
const users: Record<string, Who> = {
  superadmin: { id: "u-super", role: "SUPERADMIN" },
  otherSuperadmin: { id: "u-super-2", role: "SUPERADMIN" },
  staff: { id: "u-staff", role: "SUPPORT" },
  customer: { id: "u-cust", role: "USER" },
};

const prisma: any = {
  user: { findUnique: async ({ where }: any) => Object.values(users).find((u) => u.id === where.id) && { role: Object.values(users).find((u) => u.id === where.id)!.role, isAdmin: false } },
};
const alerts: any = { recordPermissionDenial: async () => {} };
// Real verifyStepUpToken logic, bound to our JwtService, without constructing all of AuthService.
const authLike: any = { jwt, verifyStepUpToken: (t: string, id: string) => (AuthService.prototype as any).verifyStepUpToken.call({ jwt }, t, id) };

function guardInstance(g: any) {
  if (g === DcgEnabledGuard) return new DcgEnabledGuard();
  if (g === PermissionsGuard) return new PermissionsGuard(new Reflector(), prisma, alerts);
  if (g === StepUpGuard) return new StepUpGuard(authLike);
  if (g === JwtAuthGuard) return { canActivate: () => true }; // session check is covered elsewhere; req.user is supplied below
  throw new Error("unexpected guard " + g?.name);
}

/** Run every guard Nest would run for this handler; resolves to "ALLOW" or the denial. */
async function attempt(method: keyof SmsAdminController, who: Who | null, headers: Record<string, string> = {}) {
  const proto = SmsAdminController.prototype as any;
  const guards = [
    ...(Reflect.getMetadata(GUARDS_METADATA, SmsAdminController) || []),
    ...(Reflect.getMetadata(GUARDS_METADATA, proto[method]) || []),
  ];
  const req: any = { user: who ? { userId: who.id } : undefined, headers, method: "POST", originalUrl: "/api/admin/sms/x", url: "/x" };
  const ctx: any = { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => proto[method], getClass: () => SmsAdminController };
  try {
    for (const g of guards) await guardInstance(g).canActivate(ctx);
    return "ALLOW";
  } catch (e: any) {
    if (e instanceof ForbiddenException) {
      const r: any = e.getResponse();
      return r?.code === "STEP_UP_REQUIRED" ? "STEP_UP_REQUIRED" : "FORBIDDEN";
    }
    if (e instanceof ServiceUnavailableException) return "MODULE_DISABLED";
    throw e;
  }
}

const stepUp = (userId: string, opts: { expiresIn?: number | string; purpose?: string; temp?: boolean } = {}) =>
  jwt.sign({ sub: userId, temp: opts.temp ?? true, purpose: opts.purpose ?? "step-up" }, { expiresIn: (opts.expiresIn ?? 300) as any });

const READ = ["list", "history", "analytics", "audit", "webhookConfig"] as const;
const MANAGE_STEPUP = ["register", "activate", "suspend", "revoke", "rotate", "spending", "migrate", "registerSender", "disableSender"] as const;

const ENV = { ...process.env };
beforeEach(() => {
  process.env = { ...ENV, DCG_ENABLED: "true" };
});
afterAll(() => {
  process.env = ENV;
});

describe("provider administration access matrix", () => {
  describe("module switch", () => {
    it("everything is dark while DCG_ENABLED is off, even for a superadmin with step-up", async () => {
      process.env.DCG_ENABLED = "false";
      expect(await attempt("list", users.superadmin)).toBe("MODULE_DISABLED");
      expect(await attempt("register", users.superadmin, { "x-step-up-token": stepUp(users.superadmin.id) })).toBe("MODULE_DISABLED");
    });
  });

  describe("ordinary customer", () => {
    it("is denied every read and every management endpoint", async () => {
      for (const m of [...READ, ...MANAGE_STEPUP]) {
        expect(await attempt(m, users.customer, { "x-step-up-token": stepUp(users.customer.id) })).toBe("FORBIDDEN");
      }
    });
  });

  describe("support / staff", () => {
    it("can read history, analytics, audit and config (ADMIN_VIEW_MESSAGING)", async () => {
      for (const m of READ) expect(await attempt(m, users.staff)).toBe("ALLOW");
    });
    it("cannot manage providers, even holding a valid step-up token", async () => {
      for (const m of MANAGE_STEPUP) {
        expect(await attempt(m, users.staff, { "x-step-up-token": stepUp(users.staff.id) })).toBe("FORBIDDEN");
      }
      expect(await attempt("validate", users.staff)).toBe("FORBIDDEN");
    });
  });

  describe("superadmin", () => {
    it("can read without step-up", async () => {
      for (const m of READ) expect(await attempt(m, users.superadmin)).toBe("ALLOW");
    });
    it("can manage with a fresh step-up token", async () => {
      const h = { "x-step-up-token": stepUp(users.superadmin.id) };
      for (const m of MANAGE_STEPUP) expect(await attempt(m, users.superadmin, h)).toBe("ALLOW");
    });
    it("is stopped at step-up when no token is sent", async () => {
      for (const m of MANAGE_STEPUP) expect(await attempt(m, users.superadmin)).toBe("STEP_UP_REQUIRED");
    });
    it("is stopped when the step-up token has expired", async () => {
      const expired = stepUp(users.superadmin.id, { expiresIn: -10 });
      for (const m of MANAGE_STEPUP) expect(await attempt(m, users.superadmin, { "x-step-up-token": expired })).toBe("STEP_UP_REQUIRED");
    });
    it("is stopped when the step-up token belongs to someone else", async () => {
      const theirs = stepUp(users.otherSuperadmin.id);
      expect(await attempt("register", users.superadmin, { "x-step-up-token": theirs })).toBe("STEP_UP_REQUIRED");
    });
    it("rejects a token with the wrong purpose (e.g. the login OTP temp token)", async () => {
      const otp = stepUp(users.superadmin.id, { purpose: "otp-login" });
      expect(await attempt("register", users.superadmin, { "x-step-up-token": otp })).toBe("STEP_UP_REQUIRED");
    });
    it("rejects a normal session token presented as step-up proof", async () => {
      const session = jwt.sign({ sub: users.superadmin.id, email: "a@b.c" }, { expiresIn: 300 });
      expect(await attempt("register", users.superadmin, { "x-step-up-token": session })).toBe("STEP_UP_REQUIRED");
    });
    it("rejects a token signed with a different secret, and garbage", async () => {
      const forged = new JwtService({ secret: "another-secret-another-secret-another-1" }).sign({ sub: users.superadmin.id, temp: true, purpose: "step-up" }, { expiresIn: 300 });
      expect(await attempt("register", users.superadmin, { "x-step-up-token": forged })).toBe("STEP_UP_REQUIRED");
      expect(await attempt("register", users.superadmin, { "x-step-up-token": "not.a.jwt" })).toBe("STEP_UP_REQUIRED");
    });
  });

  describe("structure", () => {
    it("every management endpoint that changes credentials, senders, status or spending requires step-up", () => {
      const proto = SmsAdminController.prototype as any;
      for (const m of MANAGE_STEPUP) {
        const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, proto[m]) || [];
        expect(guards).toContain(StepUpGuard);
      }
    });
    it("unauthenticated requests (no user) never pass the permission guard", async () => {
      expect(await attempt("list", null)).toBe("FORBIDDEN");
    });
  });
});
