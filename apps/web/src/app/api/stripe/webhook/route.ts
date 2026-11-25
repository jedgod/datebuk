import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTierEnum } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// This is the ONLY place a user's paid tier is ever granted. The self-service
// /subscriptions/plan-change endpoint on the real backend intentionally only allows
// downgrading to FREE — upgrades must be proven by a verified Stripe payment event here.
type Plan = "PREMIUM" | "ELITE";

function planForPriceId(priceId: string | undefined | null): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE) return "ELITE";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) return "PREMIUM";
  return null;
}

function tierEnumForPlan(plan: Plan): SubscriptionTierEnum {
  // Plan ("PREMIUM" | "ELITE") and SubscriptionTierEnum share the same
  // canonical tier taxonomy now — this is an identity mapping kept as a
  // named function (rather than using `plan` directly) so the type system
  // still catches it if either type's values ever diverge again.
  return plan;
}

async function grantSubscription(params: {
  userId: string;
  plan: Plan;
  stripeSubscriptionId: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  status: string;
}) {
  const { userId, plan, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd, status } = params;

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: tierEnumForPlan(plan) },
  });

  await prisma.userSubscription.upsert({
    where: { userId },
    create: {
      userId,
      tierName: plan,
      stripeSubscriptionId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
    },
    update: {
      tierName: plan,
      stripeSubscriptionId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt: null,
      cancelAtPeriodEnd: false,
    },
  });
}

async function downgradeByStripeSubscriptionId(stripeSubscriptionId: string, status: string) {
  const existing = await prisma.userSubscription.findUnique({ where: { stripeSubscriptionId } });
  if (!existing) return;

  await prisma.user.update({ where: { id: existing.userId }, data: { subscriptionTier: "FREE" } });
  await prisma.userSubscription.update({
    where: { userId: existing.userId },
    data: { status, canceledAt: new Date() },
  });
}

async function syncSubscriptionStatus(subscription: Stripe.Subscription) {
  const existing = await prisma.userSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!existing) return;

  await prisma.userSubscription.update({
    where: { userId: existing.userId },
    data: {
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  if (subscription.status === "canceled" || subscription.status === "unpaid") {
    await prisma.user.update({ where: { id: existing.userId }, data: { subscriptionTier: "FREE" } });
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured; refusing to process webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id || undefined;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (!userId || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = planForPriceId(priceId);
        if (!plan) {
          console.error("Stripe webhook: checkout session completed with unrecognized price", priceId);
          break;
        }

        await grantSubscription({
          userId,
          plan,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status,
        });
        break;
      }

      case "customer.subscription.updated": {
        await syncSubscriptionStatus(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await downgradeByStripeSubscriptionId(subscription.id, "canceled");
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler failed", error);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
