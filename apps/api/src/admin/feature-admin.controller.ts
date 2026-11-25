import { BadRequestException, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { LIMITS, PLANS, PRICES_CENTS, SAFETY_FEATURES, isKnownFeature } from "../subscriptions/feature-policy";

/** Admin view of the plan table and the per-feature kill switch (DSACS "disabled_features"). */
@Controller("admin/features")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeatureAdminController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @RequirePermissions("ADMIN_MANAGE_SUBSCRIPTIONS")
  @Get()
  async overview() {
    const disabled = await this.prisma.disabledFeature.findMany({ orderBy: { createdAt: "desc" } });
    return {
      plans: PLANS.map((p) => ({ plan: p, priceCents: PRICES_CENTS[p] })),
      // [free, premium, elite]; -1 unlimited, 0 not included, n = per-day quota
      limits: LIMITS,
      alwaysAvailable: SAFETY_FEATURES,
      disabled,
    };
  }

  @RequirePermissions("ADMIN_MANAGE_SUBSCRIPTIONS")
  @Post(":feature/disable")
  async disable(@Req() req: any, @Param("feature") feature: string) {
    this.assertSwitchable(feature);
    await this.prisma.disabledFeature.upsert({
      where: { feature },
      update: {},
      create: { feature, disabledBy: req.user.userId },
    });
    await this.audit.log({
      action: "FEATURE_DISABLED",
      actorUserId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { feature },
    });
    return { feature, disabled: true };
  }

  @RequirePermissions("ADMIN_MANAGE_SUBSCRIPTIONS")
  @Post(":feature/enable")
  async enable(@Req() req: any, @Param("feature") feature: string) {
    this.assertSwitchable(feature);
    await this.prisma.disabledFeature.deleteMany({ where: { feature } });
    await this.audit.log({
      action: "FEATURE_ENABLED",
      actorUserId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { feature },
    });
    return { feature, disabled: false };
  }

  private assertSwitchable(feature: string) {
    if (!isKnownFeature(feature)) throw new BadRequestException("Unknown feature");
    if (SAFETY_FEATURES.includes(feature)) throw new BadRequestException("Safety features can't be disabled");
  }
}
