'use client';

import { useState, useEffect, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { schoolAnalyticsApi } from '@/lib/api-client';
import { statusClasses, dotClass, statusLabel } from '@/components/features/billing/billingStatus';
import type { PlatformUsageOverview } from '@eureka-lab/shared-types';

/**
 * Tile component for a single usage metric.
 * @param label - Tile heading text.
 * @param children - Tile body content.
 */
const Tile: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="panel p-5 flex flex-col gap-2">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    {children}
  </div>
);

/**
 * Super-admin platform usage overview tiles.
 * Fetches PlatformUsageOverview on mount. Shows inline loading/error states.
 */
export const UsageOverview: FC = () => {
  const t = useTranslations('SchoolAnalytics');
  const bt = useTranslations('SchoolBilling');
  const [data, setData] = useState<PlatformUsageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    schoolAnalyticsApi
      .overview()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : t('errorGeneric'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm py-4" aria-live="polite">
        {t('loading')}
      </p>
    );
  }

  if (error) {
    return (
      <div className="panel border-destructive/60 p-4 text-sm text-destructive" role="alert">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const seatPct = Math.round(data.seatUtilization * 100);
  const activePct =
    data.totalStudents > 0
      ? Math.round((data.totalActiveStudents / data.totalStudents) * 100)
      : 0;

  return (
    <section aria-label={t('overviewTitle')}>
      <h2 className="font-display text-xl text-glow-primary mb-3">{t('overviewTitle')}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Schools tile */}
        <Tile label={t('totalSchools')}>
          <p className="text-3xl font-bold text-foreground">{data.totalSchools}</p>
          <p className="text-xs text-muted-foreground">
            <span className="text-emerald-400">{data.schoolsByStatus.active}</span>{' '}
            {t('active')} &middot;{' '}
            <span className="text-red-400">{data.schoolsByStatus.suspended}</span>{' '}
            {t('suspended')}
          </p>
        </Tile>

        {/* Seats tile */}
        <Tile label={t('seats')}>
          <p className="text-3xl font-bold text-foreground">
            {data.totalSeatsUsed}
            <span className="text-base font-normal text-muted-foreground">
              /{data.totalSeatLimit}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('utilization')}: {seatPct}%
          </p>
        </Tile>

        {/* Students tile */}
        <Tile label={t('students')}>
          <p className="text-3xl font-bold text-foreground">{data.totalStudents}</p>
          <p className="text-xs text-muted-foreground">
            {data.totalActiveStudents} {t('activeStudents')} ({activePct}%)
          </p>
        </Tile>

        {/* Billing mix tile */}
        <Tile label={t('billingMix')}>
          <ul className="flex flex-col gap-1">
            {Object.entries(data.billingStatusMix).map(([status, count]) => (
              <li key={status} className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-block h-2 w-2 rounded-full shrink-0 ${dotClass(status)}`}
                  aria-hidden="true"
                />
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusClasses(status)}`}>
                  {statusLabel(status, bt)}
                </span>
                <span className="text-muted-foreground">&times;{count}</span>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </section>
  );
};
