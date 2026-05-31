'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolTeacherSummary } from '@eureka-lab/shared-types';

interface TeachersTableProps {
  teachers: SchoolTeacherSummary[];
  busyUid: string | null;
  onToggle: (teacher: SchoolTeacherSummary) => void;
}

/**
 * Teachers list with an active/inactive pill and a per-row toggle.
 * @param teachers - Rows.
 * @param busyUid - Uid currently mutating (disables its button).
 * @param onToggle - Called to flip a teacher's active state.
 */
export const TeachersTable: FC<TeachersTableProps> = ({ teachers, busyUid, onToggle }) => {
  const t = useTranslations('SchoolAdmin');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('email')}</th>
            <th className="px-4 py-3">{t('name')}</th>
            <th className="px-4 py-3">{t('status')}</th>
            <th className="px-4 py-3 text-right">{' '}</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.uid} className="border-t border-border/40">
              <td className="px-4 py-3 font-mono text-muted-foreground">{teacher.email}</td>
              <td className="px-4 py-3 text-foreground">{teacher.displayName}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    teacher.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${teacher.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                  {teacher.active ? t('active') : t('inactive')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onToggle(teacher)}
                  disabled={busyUid === teacher.uid}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {teacher.active ? t('deactivate') : t('reactivate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
