/**
 * XP progress bar component.
 * Shows current level, XP progress to next level, and level name.
 *
 * @module XpBar
 */

'use client';

import { useTranslations } from 'next-intl';
import { XP_LEVELS, getXpLevel } from '@eureka-lab/shared-types';
import type { XpLevel } from '@eureka-lab/shared-types';

/** Props for the XpBar component */
interface XpBarProps {
  /** Total XP earned */
  xp: number;
  /** Whether to show compact version */
  compact?: boolean;
}

/**
 * XP progress bar showing current level, XP progress, and level name.
 * @param props - Component props
 * @returns XP bar element
 */
export function XpBar({ xp, compact = false }: XpBarProps) {
  const t = useTranslations('Gamification');
  const currentLevel = getXpLevel(xp);
  const nextLevel = XP_LEVELS.find((l) => l.level === currentLevel.level + 1);

  const xpInLevel = xp - currentLevel.minXp;
  const levelRange = nextLevel
    ? nextLevel.minXp - currentLevel.minXp
    : 1;
  const progress = nextLevel
    ? Math.min((xpInLevel / levelRange) * 100, 100)
    : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg" role="img" aria-label={currentLevel.name}>
          {currentLevel.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={xp}
              aria-valuemin={currentLevel.minXp}
              aria-valuemax={nextLevel?.minXp ?? xp}
              aria-label={t('xpProgress')}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {xp} XP
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={currentLevel.name}>
            {currentLevel.icon}
          </span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('level')} {currentLevel.level}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentLevel.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {xp} XP
          </p>
          {nextLevel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {nextLevel.minXp - xp} {t('xpToNextLevel')}
            </p>
          )}
        </div>
      </div>

      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={xp}
          aria-valuemin={currentLevel.minXp}
          aria-valuemax={nextLevel?.minXp ?? xp}
          aria-label={t('xpProgress')}
        />
      </div>

      {nextLevel && (
        <p className="text-xs text-gray-400 mt-1 text-center">
          {t('nextLevel')}: {nextLevel.icon} {nextLevel.name}
        </p>
      )}
    </div>
  );
}
