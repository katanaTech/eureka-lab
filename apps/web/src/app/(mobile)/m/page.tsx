'use client';

import { type FC, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Flame,
  Zap,
  BookOpen,
  Workflow,
  Code,
  Bot,
  Trophy,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/stores/gamification-store';
import { modulesApi, gamificationApi, classroomsApi } from '@/lib/api-client';
import type {
  ModuleListItem,
  LeaderboardEntry,
  ClassroomSummary,
} from '@/lib/api-client';
import type { ChildSummary } from '@eureka-lab/shared-types';

/**
 * Mobile home page — renders role-based dashboard for student, parent, or teacher.
 * Shows streak, XP progress, quick actions, and contextual alerts.
 */
export default function MobileHomePage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'child':
      return <StudentHome />;
    case 'parent':
      return <ParentHome />;
    case 'teacher':
      return <TeacherHome />;
    default:
      return <StudentHome />;
  }
}

// ── Student Home ─────────────────────────────────────────────────────────────

/** Student (child) mobile home dashboard */
const StudentHome: FC = () => {
  const t = useTranslations('MobileHome');
  const { user } = useAuth();
  const { xp, level, streak } = useGamificationStore();
  const [lastModule, setLastModule] = useState<ModuleListItem | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [modulesRes, leaders] = await Promise.all([
        modulesApi.list(),
        gamificationApi.getLeaderboard(3),
      ]);
      const inProgress = modulesRes.modules.find((m) => m.status === 'in_progress');
      const available = modulesRes.modules.find((m) => m.status === 'available');
      setLastModule(inProgress ?? available ?? null);
      setLeaderboard(leaders);
    } catch {
      /* Graceful degradation — home still renders */
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Calculate daily XP goal progress (goal: 100 XP/day) */
  const dailyGoal = 100;
  const dailyProgress = Math.min((xp % dailyGoal) / dailyGoal, 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting */}
      <h1 className="text-xl font-bold text-foreground">
        {t('greeting', { name: user?.displayName?.split(' ')[0] ?? '' })}
      </h1>

      {/* Streak + XP row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak card */}
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
          <Flame className="h-8 w-8 text-orange-500" aria-hidden="true" />
          <span className="mt-1 text-2xl font-bold text-foreground">
            {streak?.current ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">{t('dayStreak')}</span>
        </div>

        {/* Daily XP progress card */}
        <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.9"
                fill="none" stroke="currentColor"
                className="text-muted/30" strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none" stroke="currentColor"
                className="text-primary" strokeWidth="3"
                strokeDasharray={`${dailyProgress * 100} 100`}
                strokeLinecap="round"
              />
            </svg>
            <Zap className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" aria-hidden="true" />
          </div>
          <span className="mt-1 text-sm font-semibold text-foreground">
            {xp} XP
          </span>
          <span className="text-xs text-muted-foreground">
            {level?.name ?? t('level')}
          </span>
        </div>
      </div>

      {/* Continue Learning card */}
      {lastModule && (
        <a
          href={`/m/learn/${lastModule.id}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <BookOpen className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t('continueLearning')}</p>
            <p className="text-xs text-muted-foreground">{lastModule.title}</p>
          </div>
          <span className="text-xs font-medium text-primary">{t('resume')}</span>
        </a>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t('quickActions')}</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: BookOpen, label: t('actionPrompt'), href: '/m/learn' },
            { icon: Workflow, label: t('actionWorkflow'), href: '/m/learn' },
            { icon: Code, label: t('actionCode'), href: '/m/learn' },
            { icon: Bot, label: t('actionAgent'), href: '/m/learn' },
          ].map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 text-center transition-colors hover:bg-accent"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mini Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">{t('leaderboard')}</h2>
          <div className="rounded-xl border border-border bg-card">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-3 border-b border-border px-4 py-2 last:border-b-0"
              >
                <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                  {entry.rank}
                </span>
                <span className="flex-1 text-sm text-foreground">{entry.displayName}</span>
                <span className="text-xs font-medium text-primary">{entry.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Parent Home ──────────────────────────────────────────────────────────────

/** Parent mobile home dashboard — shows children overview */
const ParentHome: FC = () => {
  const t = useTranslations('MobileHome');
  const { user } = useAuth();
  const children: ChildSummary[] = user?.children ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{t('parentGreeting')}</h1>

      {/* Children cards */}
      {children.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('noChildren')}</p>
          <a href="/settings" className="mt-2 inline-block text-sm font-medium text-primary">
            {t('addChild')}
          </a>
        </div>
      ) : (
        children.map((child) => (
          <div key={child.uid} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{child.displayName}</h3>
              <span className="text-xs text-muted-foreground">
                {t('ageLabel', { age: child.age })}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-primary">
                <Zap className="h-4 w-4" aria-hidden="true" />
                {child.xp} XP
              </span>
              <span className="text-muted-foreground">
                {child.plan === 'free' ? t('freePlan') : child.plan}
              </span>
            </div>
          </div>
        ))
      )}

      {/* Quick link to full parent dashboard */}
      <a
        href="/parent"
        className="rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
      >
        {t('viewFullDashboard')}
      </a>
    </div>
  );
};

// ── Teacher Home ─────────────────────────────────────────────────────────────

/** Teacher mobile home dashboard — shows classroom summaries */
const TeacherHome: FC = () => {
  const t = useTranslations('MobileHome');
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);

  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await classroomsApi.list();
      setClassrooms(res.classrooms);
    } catch {
      /* Graceful degradation */
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{t('teacherGreeting')}</h1>

      {classrooms.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('noClassrooms')}</p>
          <a href="/teacher" className="mt-2 inline-block text-sm font-medium text-primary">
            {t('createClassroom')}
          </a>
        </div>
      ) : (
        classrooms.map((cls) => (
          <a
            key={cls.id}
            href={`/teacher/${cls.id}`}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{cls.name}</h3>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" aria-hidden="true" />
                {cls.studentCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('joinCode')}: <span className="font-mono font-semibold">{cls.joinCode}</span>
            </p>
          </a>
        ))
      )}

      {/* Quick link to full teacher dashboard */}
      <a
        href="/teacher"
        className="rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-primary transition-colors hover:bg-accent"
      >
        {t('viewFullDashboard')}
      </a>
    </div>
  );
};
