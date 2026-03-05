/**
 * Checkout success page — shown after a successful Stripe payment.
 * Refetches user profile to reflect the updated plan.
 *
 * @module checkout/success/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useAuthStore } from '../../../../stores/auth-store';
import { authApi } from '../../../../lib/api-client';

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
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('successTitle')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('successMessage')}
        </p>
        <a href="/learn">
          <Button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600">
            {t('successCta')}
          </Button>
        </a>
      </div>
    </div>
  );
}
