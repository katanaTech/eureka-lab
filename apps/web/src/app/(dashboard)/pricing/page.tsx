/**
 * Pricing page — displays available subscription plans.
 * Parents can upgrade from Free to Explorer or Creator plans.
 *
 * @module pricing/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PRICING_PLANS } from '@eureka-lab/shared-types';
import { useAuthStore } from '../../../stores/auth-store';
import { paymentsApi } from '../../../lib/api-client';
import { PricingCard } from '../../../components/features/payments/PricingCard';
import { Skeleton } from '../../../components/ui/skeleton';

/**
 * Pricing page component.
 * Displays 3 plan cards. Upgrade buttons redirect to Stripe Checkout.
 *
 * @returns Pricing page
 */
export default function PricingPage() {
  const t = useTranslations('Pricing');
  const { user, isLoading: authLoading } = useAuthStore();
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle plan upgrade — creates Stripe Checkout session and redirects.
   * @param plan - Target plan ('explorer' or 'creator')
   */
  const handleUpgrade = async (plan: 'explorer' | 'creator') => {
    setUpgradeLoading(plan);
    setError(null);
    try {
      const { url } = await paymentsApi.createCheckout(plan);
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
      setUpgradeLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const currentPlan = user?.plan ?? 'free';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Page header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            isLoading={upgradeLoading === plan.id}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        {t('footerNote')}
      </p>
    </div>
  );
}
