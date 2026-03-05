/**
 * Achievements page — full gamification dashboard.
 * Shows XP progress, badges, streaks, and activity calendar.
 *
 * @module achievements/page
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGamificationStore } from '../../../stores/gamification-store';
import { XpBar } from '../../../components/features/gamification/XpBar';
import { StreakCounter } from '../../../components/features/gamification/StreakCounter';
import { BadgeGrid } from '../../../components/features/gamification/BadgeGrid';
import { ActivityCalendar } from '../../../components/features/gamification/ActivityCalendar';
import { Skeleton } from '../../../components/ui/skeleton';

/**
 * Achievements page component.
 * Fetches and displays full gamification profile.
 *
 * @returns Achievements page
 */
export default function AchievementsPage() {
  const t = useTranslations('Gamification');
  const {
    xp,
    level,
    streak,
    badges,
    recentActivity,
    isLoading,
    refreshProfile,
  } = useGamificationStore();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  if (isLoading && !level) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('achievementsTitle')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('achievementsSubtitle')}
        </p>
      </div>

      {/* XP + Streak row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <XpBar xp={xp} />
        {streak && (
          <StreakCounter
            current={streak.current}
            longest={streak.longest}
            expanded
          />
        )}
      </div>

      {/* Activity Calendar */}
      {recentActivity.length > 0 && (
        <ActivityCalendar activities={recentActivity} />
      )}

      {/* Badges */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('badges')}
        </h2>
        <BadgeGrid earnedBadges={badges} />
      </div>
    </div>
  );
}
