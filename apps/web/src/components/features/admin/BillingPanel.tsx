'use client';

import { useState, useEffect, useCallback, type FC, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { GameButton } from '@/components/game/GameButton';
import { schoolBillingApi } from '@/lib/api-client';
import type { SchoolBillingSummary } from '@eureka-lab/shared-types';
import { statusClasses, dotClass, statusLabel } from '../billing/billingStatus';

interface BillingPanelProps {
  /** School ID to load billing summary for (super-admin). */
  schoolId: string;
}

/**
 * Super-admin billing panel for a school.
 * Shows current billing status and, if no subscription exists, a set-up form.
 * @param props.schoolId - The school whose billing to display.
 */
export const BillingPanel: FC<BillingPanelProps> = ({ schoolId }) => {
  const t = useTranslations('SchoolBilling');

  const [summary, setSummary] = useState<SchoolBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set-up form state
  const [billingEmail, setBillingEmail] = useState('');
  const [trialDays, setTrialDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await schoolBillingApi.get(schoolId);
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSetUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!billingEmail) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const body: { billingEmail: string; trialDays?: number } = { billingEmail };
      const days = parseInt(trialDays, 10);
      // parseInt('') is NaN; skip the trial when empty, zero, or negative
      if (!isNaN(days) && days > 0) body.trialDays = days;
      const updated = await schoolBillingApi.setUp(schoolId, body);
      setSummary(updated);
      setBillingEmail('');
      setTrialDays('');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="panel p-5">
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

  const periodEndDate =
    summary.periodEnd != null
      ? new Date(summary.periodEnd * 1000).toLocaleDateString()
      : null;

  const displaySeats = summary.seatQuantity ?? summary.seatLimit;

  return (
    <div className="panel p-5 space-y-4">
      <h2 className="font-display text-xl text-foreground">{t('title')}</h2>

      {/* Current billing info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('status')}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(summary.status)}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass(summary.status)}`} />
            {statusLabel(summary.status, t)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('tier')}</span>
          <span className="font-medium text-foreground">{summary.tier}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('seats')}</span>
          <span className="font-medium text-foreground">
            {displaySeats} / {summary.seatLimit}
          </span>
        </div>

        {periodEndDate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('renews')}</span>
            <span className="font-medium text-foreground">{periodEndDate}</span>
          </div>
        )}

        {summary.latestInvoiceUrl && (
          <div className="flex items-center justify-between">
            <a
              href={summary.latestInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              {t('viewInvoice')}
            </a>
          </div>
        )}
      </div>

      {/* Set-up form — only when no active subscription */}
      {!summary.hasSubscription && (
        <form onSubmit={handleSetUp} className="space-y-3 pt-2 border-t border-border/40">
          <h3 className="text-sm font-medium text-foreground">{t('setUpTitle')}</h3>

          <div>
            <label htmlFor="billing-email" className="block text-xs font-medium text-foreground mb-1">
              {t('billingEmail')}
            </label>
            <input
              id="billing-email"
              type="email"
              required
              aria-label={t('billingEmail')}
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="trial-days" className="block text-xs font-medium text-foreground mb-1">
              {t('trialDays')}
            </label>
            <input
              id="trial-days"
              type="number"
              min={0}
              max={90}
              aria-label={t('trialDays')}
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          )}

          <GameButton type="submit" variant="primary" size="sm" disabled={submitting}>
            {submitting ? t('loading') : t('setUpCta')}
          </GameButton>
        </form>
      )}
    </div>
  );
};
