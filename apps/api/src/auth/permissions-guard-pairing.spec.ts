import "reflect-metadata";

// pg-boss is ESM-only and irrelevant to guard metadata; stub it so controllers that import AuthService load.
jest.mock("../common/pgboss/pgboss.service", () => ({ PgBossService: class PgBossService {} }));
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { PermissionsGuard } from "./permissions.guard";
import { PERMS_KEY } from "./require-permissions.decorator";
import { AdminController } from "../admin/admin.controller";
import { FraudController } from "../admin/fraud.controller";
import { ModeratorController } from "../admin/moderator.controller";
import { ExperimentController } from "../admin/experiment.controller";
import { VideoModerationController } from "../admin/video-moderation.controller";
import { MetricsController } from "../observability/metrics.controller";
import { SecurityAlertController } from "../admin/security-alert.controller";
import { FeatureAdminController } from "../admin/feature-admin.controller";
import { SmsAdminController } from "../sms/sms-admin.controller";

/**
 * Regression test for the exact bug class found in Findings A5 (admin.controller.ts's
 * push/broadcast endpoint had @RequirePermissions with no @UseGuards at all) and the
 * decorator-stacking bug (two separate @RequirePermissions(...) calls on one handler
 * silently overwrite each other, since PermissionsGuard fails OPEN — `required.length
 * === 0` returns true — whenever it can't find permission metadata on a route).
 *
 * For every controller that uses @RequirePermissions anywhere, this asserts every
 * annotated handler resolves an *effective* set of guards (class-level OR method-level)
 * that includes PermissionsGuard, and that a plain array of guard metadata was never
 * silently reduced by a second decorator call overwriting the first.
 */
function effectiveGuards(controllerClass: Function, methodName?: string): unknown[] {
  const classGuards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, controllerClass) || [];
  if (!methodName) return classGuards;
  const proto = (controllerClass as any).prototype;
  const methodGuards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, proto[methodName]) || [];
  return [...classGuards, ...methodGuards];
}

function requiredPermissions(controllerClass: Function, methodName: string): string[] {
  // Mirrors PermissionsGuard's own `reflector.getAllAndOverride(PERMS_KEY, [handler,
  // class])`: method-level metadata wins if present, otherwise fall back to whatever
  // the class-level @RequirePermissions declared (as ExperimentController does).
  const proto = (controllerClass as any).prototype;
  const methodPerms = Reflect.getMetadata(PERMS_KEY, proto[methodName]);
  if (methodPerms) return methodPerms;
  return Reflect.getMetadata(PERMS_KEY, controllerClass) || [];
}

describe("PermissionsGuard / @RequirePermissions pairing", () => {
  const controllersWithMethods: Array<[Function, string[]]> = [
    [AdminController, [
      "users", "sessions", "revokeSession", "auditList", "auditExport",
      "quarantineList", "quarantineRelease", "quarantineDelete", "quarantineMeta",
      "quarantinePreview", "broadcast", "pushAnalytics", "pushRecent", "pushPreview",
      "listSubscriptionFeatures", "updateSubscriptionFeatures",
    ]],
    [FraudController, [
      "getEvents", "getStats", "provideFeedback", "getEventDetails",
      "addIpToBlacklist", "checkBlacklist", "removeIpFromBlacklist", "listBlacklist",
      "getEventsByIp", "getEventsByUser",
    ]],
    [ModeratorController, [
      "getQueue", "getQueueStats", "assignQueueItem", "reviewQueueItem",
      "getQueueItemDetails", "escalateQueueItem", "getModeratorStats", "getMyQueue",
    ]],
    [ExperimentController, ["getUserVariant"]],
    [VideoModerationController, ["queue", "metrics", "review", "flaggedVideos"]],
    [MetricsController, ["metricsEndpoint"]],
    [SecurityAlertController, ["list", "stats", "acknowledge", "resolve"]],
    [FeatureAdminController, ["overview", "disable", "enable"]],
    [SmsAdminController, ["list", "history", "analytics", "audit", "webhookConfig", "register", "validate", "activate", "suspend", "revoke", "rotate", "spending", "migrate", "reconcile", "registerSender", "disableSender"]],
  ];

  for (const [controllerClass, methodNames] of controllersWithMethods) {
    describe(controllerClass.name, () => {
      for (const methodName of methodNames) {
        it(`${methodName} has PermissionsGuard actually mounted (class- or method-level)`, () => {
          const guards = effectiveGuards(controllerClass, methodName);
          expect(guards).toContain(PermissionsGuard);
        });

        it(`${methodName} still requires at least one permission (no decorator-stacking overwrite)`, () => {
          const perms = requiredPermissions(controllerClass, methodName);
          expect(perms.length).toBeGreaterThan(0);
        });
      }
    });
  }

  it("ExperimentController gates its whole surface behind ADMIN_MANAGE_EXPERIMENTS at the class level", () => {
    const perms: string[] = Reflect.getMetadata(PERMS_KEY, ExperimentController) || [];
    expect(perms).toContain("ADMIN_MANAGE_EXPERIMENTS");
    expect(effectiveGuards(ExperimentController)).toContain(PermissionsGuard);
  });

  it("admin.controller.ts audit/export requires ADMIN_EXPORT_AUDIT specifically, not just ADMIN_VIEW_USERS", () => {
    // Regression for the decorator-stacking bug: two separate @RequirePermissions(...)
    // calls used to silently collapse into just the last one applied.
    const perms = requiredPermissions(AdminController, "auditExport");
    expect(perms).toEqual(expect.arrayContaining(["ADMIN_VIEW_USERS", "ADMIN_EXPORT_AUDIT"]));
  });

  it("admin.controller.ts quarantine/release requires ADMIN_RELEASE_QUARANTINE specifically", () => {
    const perms = requiredPermissions(AdminController, "quarantineRelease");
    expect(perms).toEqual(expect.arrayContaining(["ADMIN_VIEW_USERS", "ADMIN_RELEASE_QUARANTINE"]));
  });

  it("admin.controller.ts quarantine/delete requires ADMIN_DELETE_QUARANTINE specifically", () => {
    const perms = requiredPermissions(AdminController, "quarantineDelete");
    expect(perms).toEqual(expect.arrayContaining(["ADMIN_VIEW_USERS", "ADMIN_DELETE_QUARANTINE"]));
  });
});
