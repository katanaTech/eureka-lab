/**
 * Badge card component.
 * Displays a single badge with icon, name, description, and earned date.
 * Shows in grayscale if not yet earned.
 *
 * @module BadgeCard
 */

'use client';

import { useTranslations } from 'next-intl';
import type { Badge, BadgeDefinition } from '@eureka-lab/shared-types';

/** Props for the BadgeCard component */
interface BadgeCardProps {
  /** Badge data (earned badge with unlockedAt, or definition for locked) */
  badge: Badge | BadgeDefinition;
  /** Whether this badge has been earned */
  earned?: boolean;
}

/**
 * Single badge display with icon, name, and description.
 * Grayscale filter applied for unearned badges.
 *
 * @param props - Component props
 * @returns Badge card element
 */
export function BadgeCard({ badge, earned = false }: BadgeCardProps) {
  const t = useTranslations('Gamification');
  const unlockedAt = 'unlockedAt' in badge ? badge.unlockedAt : undefined;

  return (
    <div
      className={`
        relative flex flex-col items-center p-4 rounded-xl border transition-all
        ${
          earned
            ? 'bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-700 shadow-sm'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50'
        }
      `}
      role="listitem"
      aria-label={`${badge.name}${earned ? ` - ${t('earned')}` : ` - ${t('locked')}`}`}
    >
      {/* Badge icon */}
      <span
        className={`text-4xl mb-2 ${earned ? '' : 'grayscale'}`}
        role="img"
        aria-hidden="true"
      >
        {badge.iconUrl}
      </span>

      {/* Badge name */}
      <p
        className={`text-sm font-semibold text-center ${
          earned
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {badge.name}
      </p>

      {/* Badge description */}
      <p
        className={`text-xs text-center mt-1 ${
          earned
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-gray-400 dark:text-gray-600'
        }`}
      >
        {badge.description}
      </p>

      {/* Earned date */}
      {earned && unlockedAt && (
        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">
          {new Date(unlockedAt).toLocaleDateString()}
        </p>
      )}

      {/* Earned check mark */}
      {earned && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs" aria-hidden="true">
            ✓
          </span>
        </div>
      )}
    </div>
  );
}
