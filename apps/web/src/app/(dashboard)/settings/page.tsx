/**
 * Settings page — user account settings and subscription management.
 * Re-skinned for fantasy chrome. Nested SubscriptionCard keeps its current
 * styling (Plan 3c polish).
 */

'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { SubscriptionCard } from '@/components/features/payments/SubscriptionCard';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const isParent = user?.role === 'parent';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="font-display text-3xl text-glow-primary">{t('title')}</h1>

      {isParent && (
        <SubscriptionCard
          plan={user?.plan ?? 'free'}
          subscription={user?.subscription ?? null}
        />
      )}
    </div>
  );
}
