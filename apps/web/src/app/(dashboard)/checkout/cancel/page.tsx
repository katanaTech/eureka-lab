/**
 * Checkout cancel page — shown when user cancels Stripe Checkout.
 * Re-skinned for fantasy chrome.
 */

'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { GameButton } from '@/components/game/GameButton';

/**
 * Checkout cancel page component.
 * Displays cancellation message with link back to pricing.
 *
 * @returns Checkout cancel page
 */
export default function CheckoutCancelPage() {
  const t = useTranslations('Checkout');

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="panel text-center max-w-md p-8 space-y-6 animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 border border-border/60">
          <XCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl text-glow-primary">{t('cancelTitle')}</h1>
        <p className="text-muted-foreground">{t('cancelMessage')}</p>
        <Link href="/pricing">
          <GameButton variant="ghost">{t('cancelCta')}</GameButton>
        </Link>
      </div>
    </div>
  );
}
