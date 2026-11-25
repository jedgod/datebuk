'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  planId: string;
  planName: string;
  onClose: () => void;
  onPurchase?: (planId: string) => Promise<void>;
}

export function PaywallModal({
  isOpen,
  planId,
  planName,
  onClose,
  onPurchase,
}: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onPurchase) {
        await onPurchase(planId);
      } else {
        // Redirect to login, then straight on to checkout for the plan the
        // visitor picked. Previously this sent `?plan=` to /login, but the
        // login page only ever reads a `next` param — the chosen plan was
        // silently dropped and the user landed on a bare login form with no
        // memory of what they wanted to buy.
        const checkoutUrl = `/dashboard/checkout?plan=${encodeURIComponent(planId)}`;
        window.location.href = `/login?next=${encodeURIComponent(checkoutUrl)}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl bg-white p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Upgrade to {planName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">
            Get instant access to all premium features and start matching with more
            people right away.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">Unlimited matches</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">Advanced search filters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">See who likes you</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <span className="text-sm text-gray-700">No ads</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading}
          className={`w-full rounded-lg font-semibold py-3 px-4 transition-colors ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-pink-500 text-white hover:bg-pink-600'
          }`}
        >
          {loading ? 'Processing...' : `Upgrade to ${planName}`}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Secure payment powered by Stripe • Cancel anytime
        </p>

        <button
          onClick={onClose}
          className="w-full mt-3 text-center text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
