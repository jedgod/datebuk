'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Entitlements {
  premium: boolean;
  elite: boolean;
}

interface CustomerInfo {
  entitlements: Entitlements;
  activeSubscriptions: string[];
  allPurchasedProductIds: string[];
}

export function useRevenueCatEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements>({
    premium: false,
    elite: false,
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Call backend API to check user's subscription status
      const response = await fetch('/api/subscriptions/entitlements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Auth token will be automatic from cookies
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        // User not authenticated
        setEntitlements({ premium: false, elite: false });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch entitlements: ${response.status}`);
      }

      const data = await response.json();
      setCustomerInfo(data);
      setEntitlements(data.entitlements);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load entitlements';
      setError(message);
      console.error('[RevenueCat Hook] Error:', message);
      // Set default free-tier entitlements on error
      setEntitlements({ premium: false, elite: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  const getCurrentTier = (): 'free' | 'premium' | 'elite' => {
    if (entitlements.elite) return 'elite';
    if (entitlements.premium) return 'premium';
    return 'free';
  };

  const hasAccess = useCallback(
    (tier: 'premium' | 'elite') => {
      if (tier === 'premium') return entitlements.premium || entitlements.elite;
      if (tier === 'elite') return entitlements.elite;
      return true; // free tier always has access
    },
    [entitlements]
  );

  const refresh = useCallback(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  return {
    entitlements,
    customerInfo,
    loading,
    error,
    refresh,
    getCurrentTier,
    hasAccess,
  };
}
