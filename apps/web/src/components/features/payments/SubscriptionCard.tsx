'use client';

import { type FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, ExternalLink, AlertTriangle } from 'lucide-react';
import type { SubscriptionData, PlanType } from '@eureka-lab/shared-types';
import { Button } from '@/components/ui/button';
import { paymentsApi } from '@/lib/api-client';

interface SubscriptionCardProps {
  /** User's current plan type */
  plan: PlanType;
  /** Subscription data, null if on free plan */
  subscription: SubscriptionData | null;
}

/**
 * SubscriptionCard — shows current plan info and management actions.
 * If subscribed: plan name, status, next billing, "Manage Subscription" button.
 * If free: "Free Plan" with link to pricing page.
 *
 * @param plan - Current plan type
 * @param subscription - Subscription details or null
 */
export const SubscriptionCard: FC<SubscriptionCardProps> = ({
  plan,
  subscription,
}) => {
  const t = useTranslations('Settings');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Format a Unix timestamp to a localized date string.
   * @param timestamp - Unix timestamp in seconds
   * @returns Formatted date string
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Get the translated status label.
   * @param status - Subscription status string
   * @returns Translated status label
   */
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      active: t('statusActive'),
      past_due: t('statusPastDue'),
      canceled: t('statusCanceled'),
      incomplete: t('statusIncomplete'),
    };
    return statusMap[status] ?? status;
  };

  /**
   * Handle "Manage Subscription" — redirect to Stripe Customer Portal.
   */
  const handleManage = async () => {
    setIsLoading(true);
    try {
      const { url } = await paymentsApi.createPortal(window.location.href);
      window.location.href = url;
    } catch {
      setIsLoading(false);
    }
  };

  const hasSubscription = subscription && subscription.status !== 'incomplete';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-purple-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('subscriptionSection')}
        </h2>
      </div>

      {hasSubscription ? (
        <div className="space-y-4">
          {/* Plan name + status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('currentPlan')}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {plan}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : subscription.status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {getStatusLabel(subscription.status)}
            </span>
          </div>

          {/* Next billing date */}
          {subscription.currentPeriodEnd > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('nextBilling')}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          )}

          {/* Cancel warning */}
          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t('cancelWarning', { date: formatDate(subscription.currentPeriodEnd) })}
              </p>
            </div>
          )}

          {/* Manage subscription button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManage}
            disabled={isLoading}
          >
            <ExternalLink className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4" aria-hidden="true" />
            {isLoading ? '...' : t('manageSub')}
          </Button>
        </div>
      ) : (
        /* Free plan state */
        <div className="space-y-4">
          <p className="text-gray-500 dark:text-gray-400">
            {t('noSubscription')}
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            {t('upgradeLink')}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
};
