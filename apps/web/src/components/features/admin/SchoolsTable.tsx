'use client';

import { useState, useEffect, type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolSummary, SchoolUsageRow } from '@eureka-lab/shared-types';
import { SchoolStatusBadge } from './SchoolStatusBadge';
import { schoolAnalyticsApi } from '@/lib/api-client';
import { statusClasses, dotClass, statusLabel } from '@/components/features/billing/billingStatus';

interface SchoolsTableProps {
  schools: SchoolSummary[];
  onRowClick: (id: string) => void;
}

/**
 * Billing status badge rendered inline with a translated label.
 * @param status - Stripe billing status string.
 */
const BillingBadge: FC<{ status: string }> = ({ status }) => {
  const bt = useTranslations('SchoolBilling');
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${statusClasses(status)}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass(status)}`} aria-hidden="true" />
      {statusLabel(status, bt)}
    </span>
  );
};

/**
 * Schools list table with optional usage-analytics columns.
 * Analytics data loads independently — existing columns render immediately.
 * @param schools - Rows to render.
 * @param onRowClick - Called with a school id on row activation.
 */
export const SchoolsTable: FC<SchoolsTableProps> = ({ schools, onRowClick }) => {
  const t = useTranslations('Admin');
  const ta = useTranslations('SchoolAnalytics');

  const [usageMap, setUsageMap] = useState<Map<string, SchoolUsageRow>>(new Map());
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAnalyticsLoading(true);
    schoolAnalyticsApi
      .schools()
      .then((res) => {
        if (cancelled) return;
        const map = new Map<string, SchoolUsageRow>();
        for (const row of res.schools) {
          map.set(row.schoolId, row);
        }
        setUsageMap(map);
      })
      .catch(() => {
        /* Analytics load is best-effort; existing table still renders */
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Placeholder shown while analytics are loading. */
  const placeholder = analyticsLoading ? (
    <span className="text-muted-foreground/40" aria-label={ta('loading')}>…</span>
  ) : (
    <span className="text-muted-foreground" aria-label={ta('notAvailable')}>—</span>
  );

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">{t('schoolName')}</th>
            <th scope="col" className="px-4 py-3">{t('seats')}</th>
            <th scope="col" className="px-4 py-3">{t('status')}</th>
            <th scope="col" className="px-4 py-3">{ta('colUtilization')}</th>
            <th scope="col" className="px-4 py-3">{ta('colStudents')}</th>
            <th scope="col" className="px-4 py-3">{ta('colActive')}</th>
            <th scope="col" className="px-4 py-3">{ta('colBilling')}</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => {
            const usage = usageMap.get(s.id);
            return (
              <tr
                key={s.id}
                tabIndex={0}
                role="button"
                onClick={() => onRowClick(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(s.id);
                  }
                }}
                className="cursor-pointer border-t border-border/40 hover:bg-white/5 focus:bg-white/5 focus:outline-none"
              >
                <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.seatsUsed}/{s.seatLimit}
                </td>
                <td className="px-4 py-3">
                  <SchoolStatusBadge status={s.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {usage ? `${Math.round(usage.utilization * 100)}%` : placeholder}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {usage ? usage.seatsUsed : placeholder}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {usage ? `${Math.round(usage.activeRate * 100)}%` : placeholder}
                </td>
                <td className="px-4 py-3">
                  {usage ? <BillingBadge status={usage.billingStatus} /> : placeholder}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
