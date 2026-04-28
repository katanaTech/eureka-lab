'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UiMode, TenantUiModeLock } from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';
import { useAuthStore } from '@/stores/auth-store';
import { useCombatStore } from '@/stores/combat-store';
import { useUiMode } from '@/hooks/useUiMode';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Possible async request states for the settings save action */
type SaveState = 'idle' | 'saving' | 'success' | 'error';

/** Possible async request states for the tenant lock fetch */
type LockFetchState = 'idle' | 'loading' | 'loaded' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * User settings page — UI mode toggle.
 *
 * Handles four scenarios:
 * 1. Normal editing: user can toggle between 'normal' and 'gamified' modes.
 * 2. Tenant lock active: toggle is read-only; explanation is shown (SET-003).
 * 3. Combat in progress: toggle is disabled with a battle warning (SET-004).
 * 4. API in flight: toggle is disabled while saving.
 *
 * @returns The settings scene with UI mode toggle controls
 */
export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const combatPhase = useCombatStore((s) => s.phase);
  const { uiMode } = useUiMode();

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lockFetchState, setLockFetchState] = useState<LockFetchState>('idle');
  const [tenantLock, setTenantLock] = useState<TenantUiModeLock>({ mode: null, locked: false });
  const [pendingMode, setPendingMode] = useState<UiMode>(uiMode);

  /** Whether the user is currently in an active battle */
  const isInCombat = combatPhase !== 'idle';

  /** Whether the tenant has locked the UI mode */
  const isTenantLocked = tenantLock.locked && tenantLock.mode !== null;

  /** Whether the toggle should be disabled */
  const isToggleDisabled = isInCombat || isTenantLocked || saveState === 'saving';

  // ── Fetch tenant lock on mount ──────────────────────────────────────────────

  useEffect(() => {
    /**
     * Fetches the tenant UI mode lock from the API.
     * Uses the user's tenantId if available; otherwise falls back to a placeholder.
     */
    async function fetchTenantLock(): Promise<void> {
      // UserProfile does not yet expose tenantId — use placeholder until BE wires it up.
      // See ADR-004 and P16-BE tasks for the full resolver implementation.
      const tenantId = (user as unknown as { tenantId?: string })?.tenantId ?? 'default';

      setLockFetchState('loading');
      try {
        const res = await fetch(`/api/v1/tenants/${tenantId}/ui-mode-lock`);
        if (!res.ok) {
          // Non-2xx: treat as no lock (graceful degradation)
          setLockFetchState('loaded');
          return;
        }
        const data = (await res.json()) as TenantUiModeLock;
        setTenantLock(data);
        setLockFetchState('loaded');
      } catch {
        // Network error: treat as no lock
        setLockFetchState('error');
      }
    }

    void fetchTenantLock();
  }, [user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Sends the new UI mode preference to the backend and shows a restart notice.
   *
   * @param nextMode - The UI mode the user wants to switch to
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

      if (!res.ok) {
        setSaveState('error');
        return;
      }

      setPendingMode(nextMode);
      setSaveState('success');
    } catch {
      setSaveState('error');
    }
  }

  // ── Derived display values ──────────────────────────────────────────────────

  const effectiveMode: UiMode = isTenantLocked && tenantLock.mode ? tenantLock.mode : pendingMode;

  return (
    <Scene className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <Logo withText={false} />
          <GameButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/g/dashboard')}
            aria-label="Back to dashboard"
          >
            ← Back
          </GameButton>
        </header>

        <h1 className="mb-2 font-display text-3xl uppercase tracking-widest text-glow-primary">
          Settings
        </h1>
        <p className="mb-8 text-sm text-muted-foreground tracking-wider">
          Customise your Eureka Lab experience
        </p>

        {/* UI Mode card */}
        <section
          aria-labelledby="ui-mode-heading"
          className="rounded-2xl border border-primary/30 bg-card/80 p-6"
        >
          <h2
            id="ui-mode-heading"
            className="mb-1 font-display text-base uppercase tracking-widest text-foreground"
          >
            Interface Mode
          </h2>
          <p className="mb-6 text-xs text-muted-foreground">
            Choose how the platform looks and feels.
          </p>

          {/* Mode descriptions */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <ModeCard
              mode="normal"
              active={effectiveMode === 'normal'}
              disabled={isToggleDisabled}
              onSelect={handleToggle}
              title="Normal"
              description="Clean, focused layout — ideal for studying without distractions."
            />
            <ModeCard
              mode="gamified"
              active={effectiveMode === 'gamified'}
              disabled={isToggleDisabled}
              onSelect={handleToggle}
              title="Gamified"
              description="Fantasy adventure skin — earn KP, unlock gear, and battle AI zombies."
            />
          </div>

          {/* Status messages */}
          {isInCombat && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive"
            >
              Cannot change UI mode during an active battle.
            </p>
          )}

          {/* SET-003: tenant lock message */}
          {isTenantLocked && !isInCombat && (
            <p
              role="status"
              className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-muted-foreground"
            >
              Your organisation has locked the UI mode to{' '}
              <strong className="capitalize text-foreground">{tenantLock.mode}</strong>.
              Contact your administrator to change this.
            </p>
          )}

          {/* Save feedback */}
          {saveState === 'success' && !isTenantLocked && !isInCombat && (
            <p
              role="status"
              className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-xs text-green-400"
            >
              Preference saved. Reload the page to apply the new mode.
            </p>
          )}

          {saveState === 'error' && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive"
            >
              Failed to save — please try again.
            </p>
          )}

          {lockFetchState === 'loading' && (
            <p className="mt-2 text-xs text-muted-foreground/60 italic">
              Checking organisation settings…
            </p>
          )}
        </section>

        {/* Admin shortcut (only visible to admin/teacher) */}
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <div className="mt-6 text-center">
            <GameButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/g/settings/admin')}
              aria-label="Open admin settings"
            >
              Organisation settings →
            </GameButton>
          </div>
        )}

      </div>
    </Scene>
  );
}

// ── ModeCard sub-component ────────────────────────────────────────────────────

interface ModeCardProps {
  /** The UI mode this card represents */
  mode: UiMode;
  /** Whether this card's mode is the currently selected mode */
  active: boolean;
  /** Whether the selection interaction is disabled */
  disabled: boolean;
  /** Callback invoked when the user selects this mode */
  onSelect: (mode: UiMode) => void;
  /** Card title displayed to the user */
  title: string;
  /** Short description of what this mode offers */
  description: string;
}

/**
 * Selectable UI-mode card displayed in the settings toggle grid.
 *
 * @param props.mode - The UI mode this card represents
 * @param props.active - Whether this mode is currently active
 * @param props.disabled - Whether selection is blocked
 * @param props.onSelect - Handler called when the card is clicked
 * @param props.title - Display title
 * @param props.description - Short description text
 * @returns A styled button-like card for mode selection
 */
function ModeCard({ mode, active, disabled, onSelect, title, description }: ModeCardProps) {
  const icon = mode === 'gamified' ? '⚔️' : '📖';

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Select ${title} mode`}
      disabled={disabled}
      onClick={() => onSelect(mode)}
      className={[
        'rounded-xl border p-4 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none',
        active
          ? 'border-primary bg-primary/20 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.5)]'
          : 'border-primary/20 bg-card/40 hover:border-primary/50 hover:bg-card/60',
      ].join(' ')}
    >
      <span className="mb-2 block text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="block font-display text-sm uppercase tracking-wider text-foreground">
        {title}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">
        {description}
      </span>
      {active && (
        <span className="mt-2 block text-[10px] font-display uppercase tracking-widest text-primary">
          Active
        </span>
      )}
    </button>
  );
}
