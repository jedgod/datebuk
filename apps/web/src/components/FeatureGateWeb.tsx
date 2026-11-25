'use client';

import { useState } from 'react';
import { useRevenueCatEntitlements } from '@/hooks/useRevenueCatEntitlements';
import { PaywallModal } from '@/components/PaywallModal';

interface FeatureGateProps {
  feature: 'premium' | 'elite';
  children: React.ReactNode;
  fallbackText?: string;
  fallbackComponent?: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
  fallbackText = `Upgrade to ${feature} to unlock this feature`,
  fallbackComponent,
}: FeatureGateProps) {
  const { entitlements, loading } = useRevenueCatEntitlements();
  const [showPaywall, setShowPaywall] = useState(false);

  const hasAccess =
    feature === 'premium'
      ? entitlements.premium || entitlements.elite
      : entitlements.elite;

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      {fallbackComponent ? (
        fallbackComponent
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-4">{fallbackText}</p>
          <button
            onClick={() => setShowPaywall(true)}
            className="inline-block rounded-lg bg-pink-500 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition-colors"
          >
            Unlock {feature}
          </button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        planId={feature}
        planName={feature.charAt(0).toUpperCase() + feature.slice(1)}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}
