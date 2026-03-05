'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/features/gamification/LevelBadge';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Parent dashboard — shows children list with gamification stats.
 * Full implementation for add-child flow in later sprints.
 */
export default function ParentDashboardPage() {
  const t = useTranslations('Parent');
  const { user } = useAuth();

  const children = user?.children ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboardTitle')}</h1>
        <Button variant="default">{t('addChild')}</Button>
      </div>

      {children.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No children added yet. Click &ldquo;{t('addChild')}&rdquo; to create a child account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div
              key={child.uid}
              className="rounded-xl border border-border p-4 space-y-3 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {child.displayName}
                </h3>
                <LevelBadge xp={child.xp} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {child.xp}
                  </p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {child.age}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('age')}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 capitalize">
                    {child.plan}
                  </p>
                  <p className="text-xs text-muted-foreground">Plan</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
