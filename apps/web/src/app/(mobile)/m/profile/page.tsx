'use client';

import { useTranslations } from 'next-intl';
import {
  User,
  Globe,
  LogOut,
  CreditCard,
  Settings,
  Users,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationStore } from '@/stores/gamification-store';
import { NotificationPreferences } from '@/components/mobile/NotificationPreferences';
import { getXpLevel } from '@eureka-lab/shared-types';

/**
 * Mobile profile page — user settings, notification preferences,
 * language selection, subscription management, and logout.
 * Includes role-specific sections for parents and teachers.
 */
export default function MobileProfilePage() {
  const t = useTranslations('MobileProfile');
  const { user, logout } = useAuth();
  const { xp } = useGamificationStore();

  if (!user) return null;

  const level = getXpLevel(xp);

  return (
    <div className="flex flex-col gap-5">
      {/* Profile header */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <User className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{user.displayName}</h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
              {user.role}
            </span>
            <span className="text-muted-foreground">
              {level.icon} {level.name}
            </span>
          </div>
        </div>
      </div>

      {/* Parent-specific: Manage Children */}
      {user.role === 'parent' && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">{t('manageChildren')}</h2>
          <div className="rounded-xl border border-border bg-card">
            <a
              href="/parent"
              className="flex items-center gap-3 border-b border-border px-4 py-3"
            >
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-foreground">{t('childAccounts')}</span>
            </a>
            <a
              href="/parent"
              className="flex items-center gap-3 px-4 py-3"
            >
              <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-foreground">{t('parentDashboard')}</span>
            </a>
          </div>
        </div>
      )}

      {/* Teacher-specific: Classroom Settings */}
      {user.role === 'teacher' && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">{t('classroomSettings')}</h2>
          <div className="rounded-xl border border-border bg-card">
            <a
              href="/teacher"
              className="flex items-center gap-3 border-b border-border px-4 py-3"
            >
              <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-foreground">{t('myClassrooms')}</span>
            </a>
            <a
              href="/teacher"
              className="flex items-center gap-3 px-4 py-3"
            >
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm text-foreground">{t('teacherDashboard')}</span>
            </a>
          </div>
        </div>
      )}

      {/* Notification preferences */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t('notifications')}</h2>
        <NotificationPreferences />
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border bg-card">
        {/* Language */}
        <a
          href="/settings"
          className="flex items-center gap-3 border-b border-border px-4 py-3"
        >
          <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">{t('language')}</span>
        </a>

        {/* Subscription */}
        <a
          href="/pricing"
          className="flex items-center gap-3 border-b border-border px-4 py-3"
        >
          <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-sm text-foreground">{t('subscription')}</span>
          <span className="text-xs font-medium text-primary">
            {user.plan === 'free' ? t('freePlan') : user.plan}
          </span>
        </a>

        {/* Settings */}
        <a
          href="/settings"
          className="flex items-center gap-3 border-b border-border px-4 py-3"
        >
          <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">{t('settings')}</span>
        </a>

        {/* Help */}
        <a
          href="/settings"
          className="flex items-center gap-3 px-4 py-3"
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-foreground">{t('help')}</span>
        </a>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full"
        onClick={logout}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        {t('logout')}
      </Button>
    </div>
  );
}
