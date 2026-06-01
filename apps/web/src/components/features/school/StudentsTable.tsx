'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolStudentSummary } from '@eureka-lab/shared-types';

interface StudentsTableProps {
  students: SchoolStudentSummary[];
  busyUid: string | null;
  onToggle: (student: SchoolStudentSummary) => void;
}

/**
 * Students list with an active/inactive pill and a per-row toggle.
 * @param students - Rows.
 * @param busyUid - Uid currently mutating (disables its button).
 * @param onToggle - Called to flip a student's active state.
 */
export const StudentsTable: FC<StudentsTableProps> = ({ students, busyUid, onToggle }) => {
  const t = useTranslations('SchoolStudents');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('username')}</th>
            <th className="px-4 py-3">{t('name')}</th>
            <th className="px-4 py-3">{t('status')}</th>
            <th className="px-4 py-3 text-right">{' '}</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.uid} className="border-t border-border/40">
              <td className="px-4 py-3 font-mono text-muted-foreground">{student.username}</td>
              <td className="px-4 py-3 text-foreground">{student.displayName}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    student.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${student.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                  {student.active ? t('active') : t('inactive')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onToggle(student)}
                  disabled={busyUid === student.uid}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {student.active ? t('deactivate') : t('reactivate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
