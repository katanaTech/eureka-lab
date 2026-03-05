/**
 * Streak counter component with flame icon.
 * Shows current streak count with animated pulse on active streak.
 *
 * @module StreakCounter
 */

'use client';

import { useTranslations } from 'next-intl';

/** Props for the StreakCounter component */
interface StreakCounterProps {
  /** Current streak in days */
  current: number;
  /** Longest streak ever */
  longest: number;
  /** Whether to show expanded view with longest streak */
  expanded?: boolean;
}

/**
 * Streak counter with flame icon and optional expanded stats.
 * @param props - Component props
 * @returns Streak counter element
 */
export function StreakCounter({
  current,
  longest,
  expanded = false,
}: StreakCounterProps) {
  const t = useTranslations('Gamification');
  const isActive = current > 0;

  if (!expanded) {
    return (
      <div
        className="flex items-center gap-1.5"
        aria-label={`${current} ${t('dayStreak')}`}
      >
        <span
          className={`text-xl ${isActive ? 'animate-pulse' : 'opacity-40'}`}
          role="img"
          aria-hidden="true"
        >
          🔥
        </span>
        <span
          className={`font-bold text-lg ${
            isActive
              ? 'text-orange-500 dark:text-orange-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {current}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <span
          className={`text-3xl ${isActive ? 'animate-pulse' : 'opacity-40'}`}
          role="img"
          aria-label={t('streak')}
        >
          🔥
        </span>
        <div>
          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
            {current} {t('days')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('currentStreak')}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t('longestStreak')}
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {longest} {t('days')}
          </span>
        </div>
      </div>
    </div>
  );
}
