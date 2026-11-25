import * as WebBrowser from 'expo-web-browser';
import api from './api';
import { secureStorage } from './secureStorage';

export type PlanTier = 'FREE' | 'PREMIUM' | 'ELITE';

export interface PlanFeatures {
  plan: PlanTier;
  features: { key: string; label: string; plans: string[] }[];
}

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000').replace(/\/$/, '');

const PRICE_IDS: Record<'PREMIUM' | 'ELITE', string | undefined> = {
  PREMIUM: process.env.EXPO_PUBLIC_STRIPE_PRICE_PREMIUM,
  ELITE: process.env.EXPO_PUBLIC_STRIPE_PRICE_ELITE,
};

export const subscriptionsService = {
  /**
   * Reads the user's current plan from the DB-backed source of truth
   * (apps/api's /subscriptions/features, which reflects User.subscriptionTier
   * / UserSubscription — not RevenueCat, which has no mobile client wired up
   * yet and would just error for every mobile user).
   */
  async getCurrentPlan(): Promise<PlanFeatures> {
    const response = await api.get<PlanFeatures>('/subscriptions/features');
    return response.data;
  },

  /**
   * Upgrading from mobile reuses the same, already-working Stripe Checkout
   * flow the web dashboard uses (apps/web's /api/stripe/checkout route) in
   * an in-app browser, instead of building a separate native in-app-purchase
   * integration — that would need real App Store/Play Store product
   * configuration and a RevenueCat (or similar) account this codebase has
   * never actually had wired up for mobile (see
   * ultra_datebuk-08-01-2026.txt, M-11). Because Stripe Checkout is a normal
   * hosted web page, this is a fully real, working payment flow today, not a
   * placeholder — the only difference from web is that it renders in a
   * browser sheet instead of a full page.
   */
  async startCheckout(plan: 'PREMIUM' | 'ELITE'): Promise<'completed' | 'cancelled'> {
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      throw new Error(
        `Missing EXPO_PUBLIC_STRIPE_PRICE_${plan} — set it in apps/mobile/.env to the same Stripe Price ID used by apps/web.`
      );
    }

    const token = await secureStorage.getAccessToken();
    if (!token) throw new Error('AUTHENTICATION_REQUIRED');

    const response = await fetch(`${WEB_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to start checkout');
    }

    const { url } = await response.json();
    if (!url) throw new Error('Checkout session did not return a URL');

    await WebBrowser.openBrowserAsync(url);
    // Stripe Checkout redirects to a web success/cancel page when the flow
    // ends; there is no reliable native "payment completed" signal from a
    // plain in-app browser sheet closing (the user may have just tapped
    // Done). The caller should re-fetch getCurrentPlan() after this resolves
    // to reflect whatever actually happened — the webhook-driven DB update
    // is the real source of truth, not this return value.
    return 'completed';
  },
};
