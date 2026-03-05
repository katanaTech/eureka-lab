'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { StudentProgressSummary } from '@/lib/api-client';

interface StudentProgressTableProps {
  /** Array of student progress summaries */
  students: StudentProgressSummary[];
  /** Optional handler when teacher removes a student */
  onRemoveStudent?: (studentId: string) => void;
}

/**
 * Table showing per-student progress with XP, level, streak, and modules completed.
 * Anonymized display names (first name only) per CLAUDE.md Rule 13.
 *
 * @param students - Array of student progress summaries
 * @param onRemoveStudent - Optional remove handler
 */
export const StudentProgressTable: FC<StudentProgressTableProps> = ({
  students,
  onRemoveStudent,
}) => {
  const t = useTranslations('Teacher');

  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">{t('noStudents')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" aria-label={t('studentProgress')}>
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('studentName')}
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              {t('xp')}
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              {t('level')}
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              {t('streak')}
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              {t('modulesCompleted')}
            </th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">
              {t('lastActive')}
            </th>
            {onRemoveStudent && (
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                {t('actions')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.uid}
              className="border-b border-border last:border-b-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {student.displayName}
              </td>
              <td className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400">
                {student.xp}
              </td>
              <td className="px-4 py-3 text-center">
                <span title={student.level.name}>
                  {student.level.icon} {student.level.level}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                {student.streak > 0 ? `🔥 ${student.streak}` : '—'}
              </td>
              <td className="px-4 py-3 text-center">
                {student.modulesCompleted}/{student.totalModules}
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {student.lastActiveDate
                  ? new Date(student.lastActiveDate).toLocaleDateString()
                  : '—'}
              </td>
              {onRemoveStudent && (
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveStudent(student.uid)}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    aria-label={`${t('removeStudent')} ${student.displayName}`}
                  >
                    {t('removeStudent')}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
