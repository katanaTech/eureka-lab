/**
 * Settings page — user account settings and subscription management.
 * Parents see subscription billing info; all users see account settings.
 *
 * @module settings/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../stores/auth-store';
import { SubscriptionCard } from '../../../components/features/payments/SubscriptionCard';
import { Skeleton } from '../../../components/ui/skeleton';

/**
 * Settings page component.
 * Displays subscription management for parents.
 *
 * @returns Settings page
 */
export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const isParent = user?.role === 'parent';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Page header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('title')}
      </h1>

      {/* Subscription section — only for parents */}
      {isParent && (
        <SubscriptionCard
          plan={user?.plan ?? 'free'}
          subscription={user?.subscription ?? null}
        />
      )}
    </div>
  );
}
