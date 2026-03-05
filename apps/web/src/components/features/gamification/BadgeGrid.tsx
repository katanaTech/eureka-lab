/**
 * Badge grid component.
 * Displays all badges (earned and unearned) in a filterable grid.
 *
 * @module BadgeGrid
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Badge, BadgeCategory } from '@eureka-lab/shared-types';
import { BADGE_DEFINITIONS } from './badge-catalog';
import { BadgeCard } from './BadgeCard';

/** Props for the BadgeGrid component */
interface BadgeGridProps {
  /** Earned badges */
  earnedBadges: Badge[];
}

/** Category filter options */
const CATEGORIES: { value: BadgeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'milestone', label: 'milestone' },
  { value: 'skill', label: 'skill' },
  { value: 'streak', label: 'streak' },
  { value: 'special', label: 'special' },
];

/**
 * Grid of all badges with earned/unearned state and category filter.
 * @param props - Component props
 * @returns Badge grid element
 */
export function BadgeGrid({ earnedBadges }: BadgeGridProps) {
  const t = useTranslations('Gamification');
  const [filter, setFilter] = useState<BadgeCategory | 'all'>('all');

  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  const filteredBadges =
    filter === 'all'
      ? BADGE_DEFINITIONS
      : BADGE_DEFINITIONS.filter((b) => b.category === filter);

  return (
    <div>
      {/* Category filter tabs */}
      <div
        className="flex flex-wrap gap-2 mb-4"
        role="tablist"
        aria-label={t('badgeCategories')}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            role="tab"
            aria-selected={filter === cat.value}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition-colors
              ${
                filter === cat.value
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }
            `}
          >
            {t(`category_${cat.label}`)}
          </button>
        ))}
      </div>

      {/* Progress summary */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {earnedBadges.length} / {BADGE_DEFINITIONS.length} {t('badgesEarned')}
      </p>

      {/* Badge grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        role="list"
        aria-label={t('badges')}
      >
        {filteredBadges.map((def) => {
          const earned = earnedIds.has(def.id);
          const earnedBadge = earnedBadges.find((b) => b.id === def.id);

          return (
            <BadgeCard
              key={def.id}
              badge={earnedBadge ?? def}
              earned={earned}
            />
          );
        })}
      </div>
    </div>
  );
}
