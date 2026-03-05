/**
 * Checkout cancel page — shown when user cancels Stripe Checkout.
 * Provides a link back to the pricing page.
 *
 * @module checkout/cancel/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { XCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

/**
 * Checkout cancel page component.
 * Displays cancellation message with link back to pricing.
 *
 * @returns Checkout cancel page
 */
export default function CheckoutCancelPage() {
  const t = useTranslations('Checkout');

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <XCircle className="h-8 w-8 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('cancelTitle')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('cancelMessage')}
        </p>
        <a href="/pricing">
          <Button variant="outline">
            {t('cancelCta')}
          </Button>
        </a>
      </div>
    </div>
  );
}
