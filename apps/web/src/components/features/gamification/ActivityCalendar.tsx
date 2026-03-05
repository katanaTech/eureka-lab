/**
 * Activity calendar heatmap component.
 * GitHub-style heatmap showing daily activity intensity.
 *
 * @module ActivityCalendar
 */

'use client';

import { useTranslations } from 'next-intl';
import type { DayActivity } from '@eureka-lab/shared-types';

/** Props for the ActivityCalendar component */
interface ActivityCalendarProps {
  /** Array of daily activity records */
  activities: DayActivity[];
}

/**
 * Get intensity level (0-4) for a day based on XP earned.
 * @param xpEarned - XP earned on this day
 * @returns Intensity level 0-4
 */
function getIntensity(xpEarned: number): number {
  if (xpEarned === 0) return 0;
  if (xpEarned < 20) return 1;
  if (xpEarned < 50) return 2;
  if (xpEarned < 100) return 3;
  return 4;
}

/** Color classes for each intensity level */
const INTENSITY_COLORS = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-indigo-200 dark:bg-indigo-900',
  'bg-indigo-300 dark:bg-indigo-700',
  'bg-indigo-500 dark:bg-indigo-500',
  'bg-indigo-700 dark:bg-indigo-300',
];

/**
 * GitHub-style activity heatmap calendar.
 * Shows daily activity over the last N days.
 *
 * @param props - Component props
 * @returns Activity calendar element
 */
export function ActivityCalendar({ activities }: ActivityCalendarProps) {
  const t = useTranslations('Gamification');

  /* Calculate total stats */
  const totalXp = activities.reduce((sum, a) => sum + a.xpEarned, 0);
  const activeDays = activities.filter((a) => a.xpEarned > 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('activityCalendar')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {activeDays} {t('activeDays')}
        </p>
      </div>

      {/* Heatmap grid */}
      <div
        className="flex flex-wrap gap-1"
        role="grid"
        aria-label={t('activityCalendar')}
      >
        {activities.map((day) => {
          const intensity = getIntensity(day.xpEarned);
          return (
            <div
              key={day.date}
              className={`
                w-4 h-4 rounded-sm ${INTENSITY_COLORS[intensity]}
                transition-colors cursor-default
              `}
              title={`${day.date}: ${day.xpEarned} XP, ${day.promptsUsed} prompts`}
              role="gridcell"
              aria-label={`${day.date}: ${day.xpEarned} XP`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">{t('less')}</p>
        <div className="flex gap-1">
          {INTENSITY_COLORS.map((color, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${color}`}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-xs text-gray-400">{t('more')}</p>
      </div>

      {/* Summary stats */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {totalXp}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('totalXpPeriod')}
          </p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {activeDays}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('activeDays')}
          </p>
        </div>
      </div>
    </div>
  );
}
