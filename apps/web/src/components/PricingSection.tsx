'use client';

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { useRevenueCatEntitlements } from '@/hooks/useRevenueCatEntitlements';
import { PaywallModal } from './PaywallModal';
import { SUBSCRIPTION_TIER_PRICING } from '@shared/types';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'Forever free',
    description: 'Start exploring matches',
    features: [
      { name: 'Create profile', included: true },
      { name: 'Browse matches', included: true },
      { name: 'Limited likes (10/day)', included: true },
      { name: 'See who liked you', included: false },
      { name: 'Advanced filters', included: false },
      { name: 'No ads', included: false },
      { name: 'Boost visibility', included: false },
    ],
    cta: 'Start Free',
    popular: false,
    tier: null,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: `$${SUBSCRIPTION_TIER_PRICING.PREMIUM.priceMonthly}`,
    period: '/month',
    description: 'Unlimited matching and communication',
    features: [
      { name: 'Create profile', included: true },
      { name: 'Browse matches', included: true },
      { name: 'Unlimited likes', included: true },
      { name: 'See who liked you', included: true },
      { name: 'Advanced filters', included: true },
      { name: 'No ads', included: true },
      { name: 'Voice calling', included: true },
      { name: 'Video calling', included: false },
      { name: 'Location sharing', included: false },
    ],
    cta: 'Go Premium',
    popular: true,
    tier: 'premium',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: `$${SUBSCRIPTION_TIER_PRICING.ELITE.priceMonthly}`,
    period: '/month',
    description: 'Complete access with video and priority',
    features: [
      { name: 'Create profile', included: true },
      { name: 'Browse matches', included: true },
      { name: 'Unlimited likes', included: true },
      { name: 'See who liked you', included: true },
      { name: 'Advanced filters', included: true },
      { name: 'No ads', included: true },
      { name: 'Priority visibility', included: true },
      { name: 'Voice & video calling', included: true },
      { name: 'Private location sharing', included: true },
    ],
    cta: 'Upgrade to Elite',
    popular: false,
    tier: 'elite',
  },
];

interface Entitlements {
  premium: boolean;
  elite: boolean;
}

export function PricingSection() {
  const { entitlements, loading } = useRevenueCatEntitlements();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPaywallPlan, setSelectedPaywallPlan] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const getCurrentTier = () => {
    if (entitlements.elite) return 'elite';
    if (entitlements.premium) return 'premium';
    return 'free';
  };

  const currentTier = getCurrentTier();

  const handlePlanSelect = async (plan: { id: string; name: string }) => {
    setSelectedPlan(plan.id);
    
    if (plan.id === 'free') {
      window.location.href = '/signup';
      return;
    }

    // Show paywall for paid plans
    setSelectedPaywallPlan(plan);
    setShowPaywall(true);
  };

  if (loading) {
    return (
      <section id="pricing" className="relative z-20 bg-slate-200/75 py-14 backdrop-blur-[2px]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">Loading...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="relative z-20 bg-slate-200/75 py-14 backdrop-blur-[2px]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Pricing</h2>
          <p className="mt-3 text-lg text-gray-600">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
          {currentTier !== 'free' && (
            <div className="mt-4 inline-block rounded-full bg-green-100 px-4 py-2">
              <p className="text-sm font-semibold text-green-800">
                Current plan: <span className="capitalize">{currentTier}</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const isCurrentPlan = plan.tier === currentTier;
            const planTier = plan.tier ?? 'free';
            const planRank = planTier === 'elite' ? 2 : planTier === 'premium' ? 1 : 0;
            const currentRank = currentTier === 'elite' ? 2 : currentTier === 'premium' ? 1 : 0;
            const isDowngrade = planRank < currentRank;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl transition-all duration-200 ${
                  plan.popular
                    ? 'ring-2 ring-pink-500 transform md:scale-105 shadow-xl'
                    : 'ring-1 ring-gray-200'
                } bg-white p-8`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="inline-block rounded-full bg-pink-500 px-4 py-1 text-sm font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isCurrentPlan || selectedPlan === plan.id}
                  className={`w-full rounded-lg font-semibold py-3 px-4 mb-6 transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : selectedPlan === plan.id
                      ? 'bg-gray-400 text-white'
                      : plan.popular
                      ? 'bg-pink-500 text-white hover:bg-pink-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan ? (
                    <>✓ Current Plan</>
                  ) : isDowngrade ? (
                    'Downgrade'
                  ) : (
                    plan.cta
                  )}
                </button>

                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span
                        className={feature.included ? 'text-gray-700' : 'text-gray-400'}
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Secure payments • Cancel anytime
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Questions about plans?{' '}
            <a href="/contact" className="font-semibold text-gray-900 hover:text-pink-500">
              Contact us
            </a>
          </p>
        </div>

        {selectedPaywallPlan && (
          <PaywallModal
            isOpen={showPaywall}
            planId={selectedPaywallPlan.id}
            planName={selectedPaywallPlan.name}
            onClose={() => {
              setShowPaywall(false);
              setSelectedPaywallPlan(null);
            }}
          />
        )}
      </div>
    </section>
  );
}
