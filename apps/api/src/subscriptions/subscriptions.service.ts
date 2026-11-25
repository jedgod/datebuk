import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { limitFor, toPlan } from './feature-policy';
import { PrismaService } from '../database/prisma.service';
import axios, { AxiosError } from 'axios';
import Stripe from 'stripe';

export interface Entitlements {
  premium: boolean;
  elite: boolean;
  'datebuk-pro': boolean;
}

export interface CustomerInfo {
  entitlements: Entitlements;
  activeSubscriptions: string[];
  allPurchasedProductIds: string[];
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly revenueCatApiKey = process.env.REVENUECAT_API_KEY;
  private readonly revenueCatBaseUrl = 'https://api.revenuecat.com/v1';
  private readonly stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  constructor(private prisma: PrismaService) {}

  async getAccessTier(userId: string): Promise<'FREE' | 'ELITE' | 'PREMIUM'> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscription: { select: { tierName: true, status: true } } },
    });
    if (!user) return 'FREE';
    const active = ['active', 'trialing'].includes(String(user.subscription?.status || '').toLowerCase());
    // Exact match now that FREE/PREMIUM/ELITE is the single canonical tier
    // taxonomy shared by SubscriptionTierEnum and the Stripe-linked
    // SubscriptionTier table — no more fuzzy .includes() reconciliation
    // between two different vocabularies (VIP/PREMIUM_PLUS no longer exist).
    const raw = String(active ? user.subscription?.tierName : user.subscriptionTier).toUpperCase();
    if (raw === 'ELITE') return 'ELITE';
    if (raw === 'PREMIUM') return 'PREMIUM';
    return 'FREE';
  }

  async requireCommunication(userId: string) {
    const tier = await this.getAccessTier(userId);
    // Plan rules live in feature-policy.ts (ported from the DSACS pack) so the app has one table.
    if (limitFor(toPlan(tier), 'chat.send') === 0) throw new ForbiddenException('Chat and voice communication require Elite or Premium');
    return tier;
  }

  // The single source of truth for voice/video call eligibility by tier. Previously this
  // rule only existed in two places that never ran against the real web call flow: a
  // web-only TS module (subscription-access-policy.ts, used by a mock scheduling route)
  // and duplicated inline in apps/signaling's call:invite handler (which only mobile's
  // client actually triggers). Real callers now go through this method via CallsService.
  async assertCallEligible(userId: string, media: 'voice' | 'video') {
    const tier = await this.getAccessTier(userId);
    const feature = media === 'video' ? 'video.start' : 'voice.start';
    if (limitFor(toPlan(tier), feature) === 0) {
      throw new ForbiddenException(media === 'video' ? 'Video calling requires Elite' : 'Voice calling requires Premium or Elite');
    }
    return tier;
  }

  async assertLikeAvailable(userId: string) {
    const tier = await this.getAccessTier(userId);
    const cap = limitFor(toPlan(tier), 'match.likes');
    if (cap < 0) return tier; // unlimited on this plan
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const likesToday = await this.prisma.like.count({ where: { fromId: userId, createdAt: { gte: start } } });
    if (cap === 0 || likesToday >= cap) throw new ForbiddenException(`Your plan includes up to ${cap} likes per day`);
    return tier;
  }

  /**
   * Get user's entitlements from RevenueCat
   */
  async getEntitlements(userId: string): Promise<{
    entitlements: Entitlements;
  }> {
    try {
      if (!this.revenueCatApiKey) {
        throw new Error('REVENUECAT_API_KEY is not configured');
      }

      const response = await axios.get(
        `${this.revenueCatBaseUrl}/subscribers/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.revenueCatApiKey}`,
            'X-API-Version': '2023-08-01',
          },
        }
      );

      const subscriber = response.data.subscriber;
      const elite = !!subscriber?.entitlements?.elite?.is_active;
      const entitlements: Entitlements = {
        premium: elite || !!subscriber?.entitlements?.premium?.is_active,
        elite,
        'datebuk-pro': !!subscriber?.entitlements?.['DateBuk Pro']?.is_active,
      };

      return { entitlements };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // If user not found, return free tier
      if (axiosError.response?.status === 404) {
        return {
          entitlements: {
            premium: false,
            elite: false,
            'datebuk-pro': false,
          },
        };
      }

      throw new BadRequestException(
        'Failed to fetch entitlements: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Get full customer info from RevenueCat
   */
  async getCustomerInfo(userId: string): Promise<CustomerInfo> {
    try {
      if (!this.revenueCatApiKey) {
        throw new Error('REVENUECAT_API_KEY is not configured');
      }

      const response = await axios.get(
        `${this.revenueCatBaseUrl}/subscribers/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.revenueCatApiKey}`,
            'X-API-Version': '2023-08-01',
          },
        }
      );

      const subscriber = response.data.subscriber;
      const elite = !!subscriber?.entitlements?.elite?.is_active;
      const entitlements: Entitlements = {
        premium: elite || !!subscriber?.entitlements?.premium?.is_active,
        elite,
        'datebuk-pro': !!subscriber?.entitlements?.['DateBuk Pro']?.is_active,
      };

      return {
        entitlements,
        activeSubscriptions: subscriber?.subscriptions
          ? Object.keys(subscriber.subscriptions)
          : [],
        allPurchasedProductIds: subscriber?.non_subscriptions
          ? Object.keys(subscriber.non_subscriptions)
          : [],
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 404) {
        return {
          entitlements: {
            premium: false,
            elite: false,
            'datebuk-pro': false,
          },
          activeSubscriptions: [],
          allPurchasedProductIds: [],
        };
      }

      throw new BadRequestException(
        'Failed to fetch customer info: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Verify purchase with RevenueCat
   */
  async verifyPurchase(userId: string, receiptToken: string) {
    try {
      if (!this.revenueCatApiKey) {
        throw new Error('REVENUECAT_API_KEY is not configured');
      }

      // This would validate the receipt with RevenueCat
      const response = await axios.post(
        `${this.revenueCatBaseUrl}/receipts`,
        {
          app_user_id: userId,
          fetch_token: receiptToken,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.revenueCatApiKey}`,
            'X-API-Version': '2023-08-01',
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      throw new BadRequestException(
        'Failed to verify purchase: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Handle subscription renewal webhook from RevenueCat
   */
  async handleSubscriptionEvent(event: any) {
    try {
      // Log webhook event
      console.log('[RevenueCat Webhook]', event.type, 'for user:', event.app_user_id);

      // Handle different event types
      const userId = event.app_user_id;

      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'PRODUCT_CHANGE':
          // Entitlements updated - could cache or notify user
          console.log('[RevenueCat] Subscription updated for user:', userId);
          break;

        case 'CANCELLATION':
        case 'EXPIRATION':
          // Subscription ended
          console.log('[RevenueCat] Subscription cancelled/expired for user:', userId);
          break;

        case 'BILLING_ISSUE':
          console.log('[RevenueCat] Billing issue for user:', userId);
          break;
      }

      return { processed: true };
    } catch (error) {
      throw new BadRequestException(
        'Failed to process subscription event: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Get subscription plan and feature flags from database
   */
  async getPlanFeatures(userId: string) {
    const [user, subscription, featureRows] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true },
      }),
      this.prisma.userSubscription.findUnique({
        where: { userId },
        select: { tierName: true },
      }),
      this.prisma.subscriptionFeature.findMany({
        select: {
          featureName: true,
          tierName: true,
          isEnabled: true,
          displayOrder: true,
        },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    const normalizePlan = (value?: string | null) => {
      const raw = String(value ?? "").toUpperCase();
      if (raw === "ELITE") return "ELITE";
      if (raw === "PREMIUM") return "PREMIUM";
      return "FREE";
    };

    const plan = normalizePlan(subscription?.tierName || user?.subscriptionTier);

    const featureMap = new Map<
      string,
      { key: string; label: string; plans: string[]; adminEnabled: boolean }
    >();

    featureRows.forEach((row) => {
      const key = row.featureName.toLowerCase().replace(/\s+/g, '-');
      const existing = featureMap.get(key) || {
        key,
        label: row.featureName,
        plans: [],
        adminEnabled: false,
      };

      const normalizedTier = normalizePlan(row.tierName);
      if (row.isEnabled) {
        if (!existing.plans.includes(normalizedTier)) {
          existing.plans.push(normalizedTier);
        }
        existing.adminEnabled = true;
      }

      featureMap.set(key, existing);
    });

    const configuredFeatures = Array.from(featureMap.values());
    const defaultFeatures = [
      { key: 'profile', label: 'Create profile', plans: ['FREE', 'PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'browse', label: 'Browse matches', plans: ['FREE', 'PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'likes', label: 'Likes (Free: 10/day; paid: unlimited)', plans: ['FREE', 'PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'see-likes', label: 'See who liked you', plans: ['PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'advanced-filters', label: 'Advanced filters', plans: ['PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'chat', label: 'Secure chat', plans: ['PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'voice', label: 'Audio calls', plans: ['PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'date-planner', label: 'Date planner and scheduling', plans: ['PREMIUM', 'ELITE'], adminEnabled: true },
      { key: 'video', label: 'Video calls', plans: ['ELITE'], adminEnabled: true },
      { key: 'location-sharing', label: 'In-call approximate location', plans: ['ELITE'], adminEnabled: true },
      { key: 'priority-visibility', label: 'Priority visibility', plans: ['ELITE'], adminEnabled: true },
    ];

    return { plan, features: configuredFeatures.length ? configuredFeatures : defaultFeatures };
  }

  /**
   * Self-service plan changes are intentionally limited to downgrading to FREE.
   * Upgrading to a paid tier requires a verified Stripe payment: that grant happens
   * exclusively in apps/web's /api/stripe/webhook handler (checkout.session.completed),
   * never from a client-supplied plan string. Without this restriction, any
   * authenticated user could have called this endpoint directly with
   * `{ plan: "ELITE" }` to grant themselves a paid tier for free.
   */
  async changePlan(userId: string, planRaw: string) {
    const normalized = String(planRaw ?? "").toUpperCase();
    if (normalized !== "FREE") {
      throw new ForbiddenException(
        "Upgrading requires a verified payment. Please use the checkout flow to upgrade your plan.",
      );
    }

    const existing = await this.prisma.userSubscription.findUnique({ where: { userId } });

    // Downgrading in-app must also stop future billing at the payment processor —
    // otherwise the user shows as FREE here while Stripe keeps charging their card.
    if (existing?.stripeSubscriptionId && this.stripe) {
      try {
        await this.stripe.subscriptions.cancel(existing.stripeSubscriptionId);
      } catch (err: any) {
        // Already canceled on Stripe's side (e.g. by the webhook) is fine to ignore;
        // any other failure is logged but must not block the local downgrade.
        if (err?.code !== 'resource_missing') {
          this.logger.error(`Failed to cancel Stripe subscription ${existing.stripeSubscriptionId}: ${err?.message || err}`);
        }
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: "FREE", subscriptionExpiresAt: null },
    });

    if (existing) {
      await this.prisma.userSubscription.update({
        where: { userId },
        data: { tierName: "FREE", status: "canceled", canceledAt: new Date(), cancelAtPeriodEnd: false },
      });
    }

    return { ok: true, plan: "FREE" };
  }
}
