'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@eureka-lab/ui';
import { LevelBadge } from '@/components/features/gamification/LevelBadge';

/** Force dynamic rendering — uses Firebase auth */
export const dynamic = 'force-dynamic';

/**
 * Parent dashboard — children list with gamification stats.
 * Re-skinned for the fantasy chrome (panel cards + GameButton + font-display).
 * Inner LevelBadge component keeps its current styling (Plan 3c polish).
 */
export default function ParentDashboardPage() {
  const t = useTranslations('Parent');
  const { user } = useAuth();

  const children = user?.children ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl text-glow-primary">{t('dashboardTitle')}</h1>
        <GameButton variant="primary" size="sm">
          {t('addChild')}
        </GameButton>
      </div>

      {children.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-muted-foreground">
            {/* TODO(plan-3c-i18n): hoist empty-state copy into messages/{en,fr,ar}.json */}
            No children added yet. Click &ldquo;{t('addChild')}&rdquo; to create a child account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div key={child.uid} className="panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">{child.displayName}</h3>
                <LevelBadge xp={child.xp} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-display text-glow-primary">{child.xp}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">XP</p>
                </div>
                <div>
                  <p className="text-lg font-display">{child.age}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                    {t('age')}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-display capitalize">{child.plan}</p>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                    Plan
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
