'use client';

import { type FC, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/stores/gamification-store';
import { gamificationApi } from '@/lib/api-client';
import type { LeaderboardEntry } from '@/lib/api-client';
import { ProgressRing } from '@/components/mobile/ProgressRing';
import { MobileActivityCalendar } from '@/components/mobile/MobileActivityCalendar';
import { MobileBadgeGrid } from '@/components/mobile/MobileBadgeGrid';
import { MobileLeaderboard } from '@/components/mobile/MobileLeaderboard';
import { getXpLevel, XP_LEVELS } from '@eureka-lab/shared-types';

/**
 * Mobile progress page — role-based view of learning progress.
 * Student: XP ring, badges, calendar, leaderboard.
 * Parent: per-child progress summary.
 * Teacher: classroom-level stats.
 */
export default function MobileProgressPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'child':
      return <StudentProgress />;
    case 'parent':
      return <ParentProgress />;
    case 'teacher':
      return <TeacherProgress />;
    default:
      return <StudentProgress />;
  }
}

// ── Student Progress ────────────────────────────────────────────────────────

/** Student progress view with XP ring, badges, activity calendar, leaderboard */
const StudentProgress: FC = () => {
  const t = useTranslations('MobileProgress');
  const { xp, level, streak, badges, recentActivity } = useGamificationStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await gamificationApi.getLeaderboard(5);
      setLeaderboard(data);
    } catch {
      /* Graceful degradation */
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  /** Calculate XP progress within current level */
  const currentLevel = level ?? getXpLevel(xp);
  const nextLevel = XP_LEVELS.find((l) => l.level === currentLevel.level + 1);
  const levelProgress = nextLevel
    ? (xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)
    : 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>

      {/* XP ring + streak row */}
      <div className="flex items-center justify-center gap-6">
        <ProgressRing
          progress={levelProgress}
          size={120}
          strokeWidth={8}
          label={`${xp} XP`}
          subLabel={`${currentLevel.icon} ${currentLevel.name}`}
        />
        <div className="flex flex-col items-center gap-1">
          <Flame className="h-8 w-8 text-orange-500" aria-hidden="true" />
          <span className="text-2xl font-bold text-foreground">{streak?.current ?? 0}</span>
          <span className="text-xs text-muted-foreground">{t('dayStreak')}</span>
          <span className="text-[10px] text-muted-foreground">
            {t('longest')}: {streak?.longest ?? 0}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t('badges')}</h2>
        <MobileBadgeGrid badges={badges} />
      </div>

      {/* Activity calendar */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t('activity')}</h2>
        <MobileActivityCalendar activities={recentActivity} />
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t('leaderboard')}</h2>
        <MobileLeaderboard entries={leaderboard} />
      </div>
    </div>
  );
};

// ── Parent Progress ────────────────────────────────────────────────────────

/** Parent progress view — per-child stats */
const ParentProgress: FC = () => {
  const t = useTranslations('MobileProgress');
  const { user } = useAuth();
  const children = user?.children ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{t('parentTitle')}</h1>

      {children.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('noChildren')}</p>
      ) : (
        children.map((child) => {
          const childLevel = getXpLevel(child.xp);
          return (
            <div key={child.uid} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-foreground">{child.displayName}</h3>
              <div className="mt-3 flex items-center gap-4">
                <ProgressRing
                  progress={child.xp / (childLevel.maxXp === Infinity ? 2000 : childLevel.maxXp)}
                  size={64}
                  strokeWidth={5}
                  label={`${child.xp}`}
                  subLabel="XP"
                />
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground">
                    {childLevel.icon} {childLevel.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('ageLabel', { age: child.age })}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}

      <a
        href="/parent"
        className="rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-primary"
      >
        {t('viewFullDashboard')}
      </a>
    </div>
  );
};

// ── Teacher Progress ───────────────────────────────────────────────────────

/** Teacher progress view — classroom stats */
const TeacherProgress: FC = () => {
  const t = useTranslations('MobileProgress');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{t('teacherTitle')}</h1>

      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('teacherDescription')}
      </p>

      <a
        href="/teacher"
        className="rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-primary"
      >
        {t('viewFullDashboard')}
      </a>
    </div>
  );
};
