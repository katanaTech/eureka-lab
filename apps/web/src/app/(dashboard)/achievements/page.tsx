/**
 * Achievements page — full gamification dashboard.
 * Re-skinned for fantasy chrome. Nested gamification components
 * (XpBar, StreakCounter, ActivityCalendar, BadgeGrid) keep their
 * current styling (Plan 3c polish).
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGamificationStore } from '@/stores/gamification-store';
import { XpBar } from '@/components/features/gamification/XpBar';
import { StreakCounter } from '@/components/features/gamification/StreakCounter';
import { BadgeGrid } from '@/components/features/gamification/BadgeGrid';
import { ActivityCalendar } from '@/components/features/gamification/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="max-w-4xl mx-auto space-y-4">
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl text-glow-primary">
          {t('achievementsTitle')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('achievementsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <XpBar xp={xp} />
        {streak && (
          <StreakCounter current={streak.current} longest={streak.longest} expanded />
        )}
      </div>

      {recentActivity.length > 0 && <ActivityCalendar activities={recentActivity} />}

      <div>
        <h2 className="font-display text-xl mb-4">{t('badges')}</h2>
        <BadgeGrid earnedBadges={badges} />
      </div>
    </div>
  );
}
