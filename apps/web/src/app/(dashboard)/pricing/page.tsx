/**
 * Pricing page — available subscription plans.
 * Re-skinned for fantasy chrome. PricingCard component unchanged (Plan 3c).
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PRICING_PLANS } from '@eureka-lab/shared-types';
import { useAuthStore } from '@/stores/auth-store';
import { paymentsApi } from '@/lib/api-client';
import { PricingCard } from '@/components/features/payments/PricingCard';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="max-w-5xl mx-auto space-y-6">
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl text-glow-primary">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

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

      <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
        {t('footerNote')}
      </p>
    </div>
  );
}
