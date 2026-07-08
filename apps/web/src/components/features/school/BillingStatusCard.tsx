'use client';

import { useState, useEffect, useCallback, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { GameButton } from '@eureka-lab/ui';
import { schoolBillingApi } from '@/lib/api-client';
import type { SchoolBillingSummary } from '@eureka-lab/shared-types';
import { statusClasses, dotClass, statusLabel } from '../billing/billingStatus';

/**
 * School-admin billing status card.
 * Shows the school's current billing tier, status badge, and seat usage.
 * If a subscription exists, provides a "Manage billing" portal button.
 */
export const BillingStatusCard: FC = () => {
  const t = useTranslations('SchoolBilling');

  const [summary, setSummary] = useState<SchoolBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await schoolBillingApi.getOwn();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setPortalError('');
    try {
      const res = await schoolBillingApi.portal(window.location.href);
      window.location.assign(res.url);
    } catch (err: unknown) {
      setPortalError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="panel p-4">
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  const displaySeats = summary.seatQuantity ?? summary.seatLimit;

  return (
    <div className="panel p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(summary.status)}`}
          aria-label={`${t('status')}: ${statusLabel(summary.status, t)}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass(summary.status)}`} />
          {statusLabel(summary.status, t)}
        </span>

        <span className="text-sm text-muted-foreground">
          {t('tier')}: <span className="font-medium text-foreground">{summary.tier}</span>
        </span>

        <span className="text-sm text-muted-foreground">
          {t('seats')}: <span className="font-medium text-foreground">{displaySeats} / {summary.seatLimit}</span>
        </span>
      </div>

      <div className="flex flex-col items-end gap-1">
        {summary.hasSubscription && (
          <GameButton
            variant="ghost"
            size="sm"
            onClick={handleManageBilling}
            disabled={portalLoading}
            aria-label={t('manageBilling')}
          >
            {portalLoading ? t('loading') : t('manageBilling')}
          </GameButton>
        )}

        {portalError && (
          <p className="text-xs text-destructive" role="alert">
            {portalError}
          </p>
        )}
      </div>
    </div>
  );
};
