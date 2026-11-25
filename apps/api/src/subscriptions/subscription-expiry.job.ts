import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../database/prisma.service";

/**
 * Safety-net reconciliation for subscription expiry (see
 * ultra_datebuk-08-01-2026.txt, finding M-3). Before this job existed, tier
 * downgrade on expiry/cancellation depended 100% on a Stripe webhook
 * (`customer.subscription.updated`/`.deleted`) being delivered successfully
 * — a missed webhook (downtime, a rotated STRIPE_WEBHOOK_SECRET, an endpoint
 * URL change) left `User.subscriptionTier` stuck on a paid tier forever,
 * since nothing else ever re-checked `currentPeriodEnd` against the clock.
 *
 * This runs hourly and downgrades any UserSubscription whose period has
 * ended but which never received a terminal webhook, closing that gap
 * independently of Stripe delivery.
 */
@Injectable()
export class SubscriptionExpiryJob {
  private readonly logger = new Logger(SubscriptionExpiryJob.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async reconcileExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.userSubscription.findMany({
      where: {
        currentPeriodEnd: { lt: now },
        status: { notIn: ["canceled", "unpaid"] },
      },
      select: { id: true, userId: true, status: true },
    });

    if (expired.length === 0) return;

    for (const sub of expired) {
      try {
        await this.prisma.$transaction([
          this.prisma.userSubscription.update({
            where: { id: sub.id },
            data: { status: "canceled", canceledAt: now, cancelAtPeriodEnd: false },
          }),
          this.prisma.user.update({
            where: { id: sub.userId },
            data: { subscriptionTier: "FREE", subscriptionExpiresAt: null },
          }),
        ]);
      } catch (error) {
        this.logger.error(
          `Failed to reconcile expired subscription ${sub.id} for user ${sub.userId}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.warn(
      `Reconciled ${expired.length} subscription(s) past currentPeriodEnd with no terminal Stripe webhook received — downgraded to FREE.`,
    );
  }
}
