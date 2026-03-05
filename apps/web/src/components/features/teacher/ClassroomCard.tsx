'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { JoinCodeDisplay } from './JoinCodeDisplay';
import type { ClassroomSummary } from '@/lib/api-client';

interface ClassroomCardProps {
  /** Classroom summary data */
  classroom: ClassroomSummary;
  /** Navigate to classroom detail */
  onClick: () => void;
}

/**
 * Card showing classroom name, join code, and student count.
 * Clicking navigates to the classroom detail page.
 *
 * @param classroom - Classroom summary data
 * @param onClick - Click handler for navigation
 */
export const ClassroomCard: FC<ClassroomCardProps> = ({
  classroom,
  onClick,
}) => {
  const t = useTranslations('Teacher');

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-gray-800"
      aria-label={classroom.name}
    >
      <h3 className="text-lg font-semibold text-foreground">
        {classroom.name}
      </h3>

      <div className="mt-3 flex items-center justify-between">
        <JoinCodeDisplay code={classroom.joinCode} />

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">
            {classroom.studentCount} {t('studentCount')}
          </span>
        </div>
      </div>
    </button>
  );
};
