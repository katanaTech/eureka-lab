'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolSummary } from '@eureka-lab/shared-types';
import { SchoolStatusBadge } from './SchoolStatusBadge';

interface SchoolsTableProps {
  schools: SchoolSummary[];
  onRowClick: (id: string) => void;
}

/**
 * Schools list table. Each row is keyboard-activatable and navigates to detail.
 * @param schools - Rows to render.
 * @param onRowClick - Called with a school id on row activation.
 */
export const SchoolsTable: FC<SchoolsTableProps> = ({ schools, onRowClick }) => {
  const t = useTranslations('Admin');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('schoolName')}</th>
            <th className="px-4 py-3">{t('seats')}</th>
            <th className="px-4 py-3">{t('status')}</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((s) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
