'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { UiMode, TenantUiModeLock } from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';
import { useAuthStore } from '@/stores/auth-store';
import { useCombatStore } from '@/stores/combat-store';
import { useUiMode } from '@/hooks/useUiMode';

type SaveState = 'idle' | 'saving' | 'success' | 'error';
type LockFetchState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Mobile settings page — UI mode toggle. Compact mirror of desktop /g/settings.
 * Navigates via /m/g/ paths.
 *
 * @returns The mobile settings scene
 */
export default function MobileSettingsPage() {
  const router = useRouter();
  const t = useTranslations('Phase16Settings');
  const user = useAuthStore((s) => s.user);
  const combatPhase = useCombatStore((s) => s.phase);
  const { uiMode } = useUiMode();

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lockFetchState, setLockFetchState] = useState<LockFetchState>('idle');
  const [tenantLock, setTenantLock] = useState<TenantUiModeLock>({ mode: null, locked: false });
  const [pendingMode, setPendingMode] = useState<UiMode>(uiMode);

  const isInCombat = combatPhase !== 'idle';
  const isTenantLocked = tenantLock.locked && tenantLock.mode !== null;
  const isToggleDisabled = isInCombat || isTenantLocked || saveState === 'saving';

  useEffect(() => {
    /** Fetch tenant UI mode lock. */
    async function fetchTenantLock(): Promise<void> {
      const tenantId = (user as unknown as { tenantId?: string })?.tenantId ?? 'default';
      setLockFetchState('loading');
      try {
        const res = await fetch(`/api/v1/tenants/${tenantId}/ui-mode-lock`);
        if (!res.ok) { setLockFetchState('loaded'); return; }
        const data = (await res.json()) as TenantUiModeLock;
        setTenantLock(data);
        setLockFetchState('loaded');
      } catch { setLockFetchState('error'); }
    }
    void fetchTenantLock();
  }, [user]);

  /**
   * @param nextMode - The UI mode to switch to
   */
  async function handleToggle(nextMode: UiMode): Promise<void> {
    if (isToggleDisabled || nextMode === pendingMode) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/v1/users/me/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uiMode: nextMode }),
      });
      if (!res.ok) { setSaveState('error'); return; }
      setPendingMode(nextMode);
      setSaveState('success');
    } catch { setSaveState('error'); }
  }

  const effectiveMode: UiMode = isTenantLocked && tenantLock.mode ? tenantLock.mode : pendingMode;

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4">
      <div className="mx-auto max-w-sm">
        <header className="mb-6 flex items-center justify-between">
          <Logo withText={false} />
          <GameButton variant="ghost" size="sm" onClick={() => router.push('/m/g/dashboard')} aria-label={t('backAria')}>
            {t('back')}
          </GameButton>
        </header>

        <h1 className="mb-1 font-display text-2xl uppercase tracking-widest text-glow-primary">{t('heading')}</h1>
        <p className="mb-6 text-xs text-muted-foreground tracking-wider">{t('subheading')}</p>

        <section aria-labelledby="ui-mode-heading" className="rounded-xl border border-primary/30 bg-card/80 p-4">
          <h2 id="ui-mode-heading" className="mb-1 font-display text-sm uppercase tracking-widest text-foreground">{t('uiModeHeading')}</h2>
          <p className="mb-4 text-[10px] text-muted-foreground">{t('uiModeDescription')}</p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            {(['normal', 'gamified'] as const).map((mode) => {
              const icon = mode === 'gamified' ? '⚔️' : '📖';
              const active = effectiveMode === mode;
              return (
                <button key={mode} type="button" aria-pressed={active}
                  aria-label={t('modeSelectAria', { title: t(mode === 'normal' ? 'modeNormalTitle' : 'modeGamifiedTitle') })}
                  disabled={isToggleDisabled} onClick={() => handleToggle(mode)}
                  className={[
                    'rounded-lg border p-3 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:opacity-50 disabled:pointer-events-none',
                    active
                      ? 'border-primary bg-primary/20 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]'
                      : 'border-primary/20 bg-card/40 hover:border-primary/50',
                  ].join(' ')}>
                  <span className="mb-1 block text-xl" aria-hidden>{icon}</span>
                  <span className="block font-display text-xs uppercase tracking-wider text-foreground">
                    {t(mode === 'normal' ? 'modeNormalTitle' : 'modeGamifiedTitle')}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground leading-relaxed">
                    {t(mode === 'normal' ? 'modeNormalDescription' : 'modeGamifiedDescription')}
                  </span>
                  {active && (
                    <span className="mt-1 block text-[9px] font-display uppercase tracking-widest text-primary">{t('modeActive')}</span>
                  )}
                </button>
              );
            })}
          </div>

          {isInCombat && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[10px] text-destructive">{t('combatBlock')}</p>
          )}
          {isTenantLocked && !isInCombat && (
            <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] text-muted-foreground">
              {t('tenantLockNoticeBefore')}<strong className="capitalize text-foreground">{tenantLock.mode}</strong>{t('tenantLockNoticeAfter')}
            </p>
          )}
          {saveState === 'success' && !isTenantLocked && !isInCombat && (
            <p role="status" className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-[10px] text-green-400">{t('saveSuccess')}</p>
          )}
          {saveState === 'error' && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[10px] text-destructive">{t('saveError')}</p>
          )}
          {lockFetchState === 'loading' && (
            <p className="mt-1 text-[10px] text-muted-foreground/60 italic">{t('lockLoading')}</p>
          )}
        </section>

        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <div className="mt-4 text-center">
            <GameButton variant="ghost" size="sm" onClick={() => router.push('/m/g/settings/admin')} aria-label={t('adminShortcutAria')}>
              {t('adminShortcut')}
            </GameButton>
          </div>
        )}
      </div>
    </Scene>
  );
}
