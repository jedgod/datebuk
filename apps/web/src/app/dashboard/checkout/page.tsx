"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SUBSCRIPTION_FEATURES, Plan } from "@/config/subscription-features";
import { EnterpriseSidebar } from "@/components/dashboard/EnterpriseSidebar";
import { MobileEnterpriseDrawer } from "@/components/dashboard/MobileEnterpriseDrawer";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_TIER_PRICING } from "@shared/types";

const PLAN_META: Record<Exclude<Plan, "FREE">, { price: string; stripePriceEnv: string }> = {
  PREMIUM: {
    price: SUBSCRIPTION_TIER_PRICING.PREMIUM.displayPrice,
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_PRICE_PREMIUM",
  },
  ELITE: {
    price: SUBSCRIPTION_TIER_PRICING.ELITE.displayPrice,
    stripePriceEnv: "NEXT_PUBLIC_STRIPE_PRICE_ELITE",
  },
};

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = (params?.get("plan") || "").toUpperCase() as Plan;
  const planMeta = plan in PLAN_META ? PLAN_META[plan as Exclude<Plan, "FREE">] : null;

  const includedFeatures = useMemo(() => {
    if (!planMeta) return [];
    return SUBSCRIPTION_FEATURES.filter((feature) => feature.plans.includes(plan));
  }, [plan, planMeta]);

  const handleCheckout = async () => {
    if (!planMeta) {
      setError("Please choose a valid plan before checkout.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Stripe Checkout is a hosted redirect page that works fine on mobile browsers,
      // so there's no need to route mobile visitors anywhere different (the previous
      // mobile-only "demo payment portal" had no working payment buttons at all, which
      // meant mobile users could never actually complete an upgrade).
      const priceId = plan === "PREMIUM"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE;

      if (!priceId) {
        setError(`Missing ${planMeta.stripePriceEnv}. Add it to apps/web/.env.local.`);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const message = await res.text();
        setError(message || "Unable to start checkout. Please try again.");
        return;
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("Checkout session did not return a redirect URL.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer />
        <EnterpriseSidebar />

        <main className="flex-1 p-6 lg:p-12">
          <div className="min-h-screen bg-gradient-to-br from-[#1b102c] via-[#12091f] to-black p-8 flex items-center justify-center">
            <div className="w-full max-w-xl rounded-[28px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-8">
              <button
                onClick={() => router.back()}
                className="mb-8 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
              >
                ← Back
              </button>

              <h1 className="text-4xl font-semibold text-pink-400 mb-8">Checkout</h1>

              {!planMeta ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-5 text-white/90">
                  No plan selected.{" "}
                  <a href="/dashboard/subscription" className="text-pink-400 hover:text-pink-300 underline">
                    Choose a plan
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-5">
                  <p className="mb-2 text-sm text-white/60">SELECTED PLAN</p>
                  <h2 className="text-2xl font-semibold mb-3">{plan}</h2>
                  <span className="inline-block rounded-md bg-pink-400 px-4 py-2 font-bold text-black">
                    {planMeta.price}
                  </span>
                </div>
              )}

              {includedFeatures.length > 0 && (
                <div className="mb-8">
                  <p className="mb-3 text-sm text-white/60">INCLUDED FEATURES</p>
                  <ul className="list-none p-0">
                    {includedFeatures.map((feature) => (
                      <li key={feature.key} className="border-b border-white/10 py-2.5 text-white/80">
                        ✓ {feature.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl border border-red-900 bg-red-950/60 p-4 text-red-300">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={!planMeta || busy}
                className={cn(
                  "w-full rounded-lg py-3.5 text-base font-bold text-black transition-colors mb-3",
                  planMeta ? "bg-pink-400 hover:bg-pink-300 cursor-pointer" : "bg-white/20 cursor-not-allowed opacity-50"
                )}
              >
                {busy ? "Redirecting..." : "Proceed to Stripe Checkout"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
