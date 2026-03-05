'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import type { PlanType } from '@eureka-lab/shared-types';
import { Button } from '@/components/ui/button';

interface UpgradeBannerProps {
  /** The plan required to unlock this content */
  requiredPlan: PlanType;
}

/**
 * UpgradeBanner — shown when a module requires a paid plan the user doesn't have.
 * Displays a gradient banner with "Unlock this module" message and CTA to pricing.
 *
 * @param requiredPlan - The minimum plan needed to unlock the content
 */
export const UpgradeBanner: FC<UpgradeBannerProps> = ({ requiredPlan }) => {
  const t = useTranslations('Pricing');

  const planLabel = t(`plan_${requiredPlan}`);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 dark:from-purple-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 border border-purple-200 dark:border-purple-800 p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start rtl:sm:text-end">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500">
          <Sparkles className="h-6 w-6 text-white" aria-hidden="true" />
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('upgrade')} — {planLabel}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* CTA */}
        <a href="/pricing">
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
          >
            {t('upgrade')}
          </Button>
        </a>
      </div>
    </div>
  );
};
