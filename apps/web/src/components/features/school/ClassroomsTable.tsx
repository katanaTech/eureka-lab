'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolClassroomSummary } from '@eureka-lab/shared-types';

interface ClassroomsTableProps {
  classrooms: SchoolClassroomSummary[];
}

/** Read-only school classroom rollup: name · teacher · #students. */
export const ClassroomsTable: FC<ClassroomsTableProps> = ({ classrooms }) => {
  const t = useTranslations('SchoolClassrooms');
  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">{t('name')}</th>
            <th className="px-4 py-3">{t('teacher')}</th>
            <th className="px-4 py-3 text-right">{t('students')}</th>
          </tr>
        </thead>
        <tbody>
          {classrooms.map((c) => (
            <tr key={c.id} className="border-t border-border/40">
              <td className="px-4 py-3 text-foreground">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.teacherName}</td>
              <td className="px-4 py-3 text-right text-foreground">{c.studentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
