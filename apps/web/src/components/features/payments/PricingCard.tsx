'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import type { PricingPlan, PlanType } from '@eureka-lab/shared-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  /** The pricing plan to display */
  plan: PricingPlan;
  /** User's current plan type */
  currentPlan: PlanType;
  /** Callback when user clicks upgrade */
  onUpgrade: (planId: 'explorer' | 'creator') => void;
  /** Whether upgrade is currently loading */
  isLoading: boolean;
}

/**
 * PricingCard — displays a single plan with price, features, and CTA.
 * Highlights the "popular" plan with a gradient border.
 *
 * @param plan - Pricing plan data
 * @param currentPlan - User's current plan
 * @param onUpgrade - Callback for upgrade action
 * @param isLoading - Loading state for button
 */
export const PricingCard: FC<PricingCardProps> = ({
  plan,
  currentPlan,
  onUpgrade,
  isLoading,
}) => {
  const t = useTranslations('Pricing');

  const isCurrent = currentPlan === plan.id;
  const isFreePlan = plan.id === 'free';
  const isDowngrade = plan.id === 'free' && currentPlan !== 'free';

  /**
   * Get the CTA button label based on plan state.
   * @returns Translated button label
   */
  const getButtonLabel = (): string => {
    if (isCurrent) return t('currentPlan');
    if (isFreePlan) return t('freePlan');
    return t('upgrade');
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm transition-shadow hover:shadow-md',
        plan.popular
          ? 'border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/20'
          : 'border-gray-200 dark:border-gray-700',
      )}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rtl:left-auto rtl:right-1/2 rtl:translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-1 text-xs font-semibold text-white">
            {t('popular')}
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t(`plan_${plan.id}`)}
      </h3>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          {plan.priceMonthly === 0 ? t('free') : `$${plan.priceMonthly}`}
        </span>
        {plan.priceMonthly > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            /{t('month')}
          </span>
        )}
      </div>

      {/* Features list */}
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((featureKey) => (
          <li key={featureKey} className="flex items-start gap-2">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t(featureKey)}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <div className="mt-6">
        <Button
          className={cn(
            'w-full',
            plan.popular && !isCurrent
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
              : '',
          )}
          variant={plan.popular && !isCurrent ? 'default' : 'outline'}
          disabled={isCurrent || isFreePlan || isDowngrade || isLoading}
          onClick={() => {
            if (!isFreePlan && !isCurrent && (plan.id === 'explorer' || plan.id === 'creator')) {
              onUpgrade(plan.id);
            }
          }}
          aria-label={`${getButtonLabel()} - ${t(`plan_${plan.id}`)}`}
        >
          {isLoading ? t('processing') : getButtonLabel()}
        </Button>
      </div>
    </div>
  );
};
