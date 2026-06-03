import type { useTranslations } from 'next-intl';

/** next-intl translation function for the SchoolBilling namespace. */
export type BillingTFn = ReturnType<typeof useTranslations<'SchoolBilling'>>;

/**
 * Map a billing status to its badge container CSS classes.
 * @param status - Stripe billing status (active|trialing|past_due|canceled|none).
 * @returns Tailwind class string for the badge.
 */
export function statusClasses(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/15 text-emerald-300';
    case 'trialing':
      return 'bg-sky-500/15 text-sky-300';
    case 'past_due':
      return 'bg-red-500/15 text-red-300';
    case 'canceled':
    case 'none':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Map a billing status to its status-dot CSS class.
 * @param status - Stripe billing status (active|trialing|past_due|canceled|none).
 * @returns Tailwind class string for the dot.
 */
export function dotClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-400';
    case 'trialing':
      return 'bg-sky-400';
    case 'past_due':
      return 'bg-red-400';
    default:
      return 'bg-muted-foreground';
  }
}

/**
 * Map a billing status to its translated label.
 * @param status - Stripe billing status (active|trialing|past_due|canceled|none).
 * @param t - SchoolBilling-namespace translation function.
 * @returns The localized status label.
 */
export function statusLabel(status: string, t: BillingTFn): string {
  switch (status) {
    case 'active':   return t('statusActive');
    case 'trialing': return t('statusTrialing');
    case 'past_due': return t('statusPastDue');
    case 'canceled': return t('statusCanceled');
    default:         return t('statusNone');
  }
}
