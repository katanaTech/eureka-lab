/**
 * Checkout success page — shown after a successful Stripe payment.
 * Re-skinned for fantasy chrome.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GameButton } from '@/components/game/GameButton';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api-client';

/**
 * Checkout success page component.
 * Displays success message and refetches user profile.
 *
 * @returns Checkout success page
 */
export default function CheckoutSuccessPage() {
  const t = useTranslations('Checkout');
  const { setUser } = useAuthStore();

  /* Refetch user profile to get updated plan and subscription data */
  useEffect(() => {
    const refresh = async () => {
      try {
        const profile = await authApi.getMe();
        setUser(profile);
      } catch {
        /* Silently fail — user can still navigate */
      }
    };
    refresh();
  }, [setUser]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel text-center max-w-md p-8 space-y-6 animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 border border-success/40">
          <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl text-glow-primary">{t('successTitle')}</h1>
        <p className="text-muted-foreground">{t('successMessage')}</p>
        <Link href="/learn">
          <GameButton variant="primary">{t('successCta')}</GameButton>
        </Link>
      </div>
    </div>
  );
}
