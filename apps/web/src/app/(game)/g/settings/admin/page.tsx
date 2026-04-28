'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UiMode, TenantUiModeLock } from '@eureka-lab/shared-types';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';
import { useAuthStore } from '@/stores/auth-store';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Possible async request states for fetching or saving tenant lock settings */
type RequestState = 'idle' | 'loading' | 'saving' | 'success' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Tenant admin settings page — UI mode lock control.
 *
 * Accessible only to users with 'admin' or 'teacher' roles. Any other role
 * sees an access-denied screen and a back button.
 *
 * Allows the admin to:
 * - View the current tenant UI mode lock configuration.
 * - Toggle the lock on or off.
 * - Choose which mode ('normal' | 'gamified') to lock the tenant to.
 * - Save via PUT /api/v1/tenants/:tenantId/ui-mode-lock.
 *
 * @returns The admin settings scene
 */
export default function AdminSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [lockConfig, setLockConfig] = useState<TenantUiModeLock>({ mode: null, locked: false });
  const [draftConfig, setDraftConfig] = useState<TenantUiModeLock>({ mode: null, locked: false });
  const [isDirty, setIsDirty] = useState(false);

  /** The tenantId sourced from the user profile; falls back to a placeholder until the BE wires it. */
  const tenantId = (user as unknown as { tenantId?: string })?.tenantId ?? 'default';

  const isAdmin = user?.role === 'admin' || user?.role === 'teacher';

  // ── Fetch on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAdmin) return;

    /**
     * Fetches the current tenant UI mode lock from the API.
     */
    async function fetchLock(): Promise<void> {
      setRequestState('loading');
      try {
        const res = await fetch(`/api/v1/tenants/${tenantId}/ui-mode-lock`);
        if (!res.ok) {
          setRequestState('error');
          return;
        }
        const data = (await res.json()) as TenantUiModeLock;
        setLockConfig(data);
        setDraftConfig(data);
        setRequestState('idle');
      } catch {
        setRequestState('error');
      }
    }

    void fetchLock();
  }, [isAdmin, tenantId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Updates the draft locked state and marks the form as dirty.
   *
   * @param locked - Whether the lock should be active
   */
  function handleLockToggle(locked: boolean): void {
    const next: TenantUiModeLock = { ...draftConfig, locked };
    setDraftConfig(next);
    setIsDirty(JSON.stringify(next) !== JSON.stringify(lockConfig));
  }

  /**
   * Updates the draft locked mode and marks the form as dirty.
   *
   * @param mode - The mode to lock the tenant to
   */
  function handleModeSelect(mode: UiMode): void {
    const next: TenantUiModeLock = { ...draftConfig, mode };
    setDraftConfig(next);
    setIsDirty(JSON.stringify(next) !== JSON.stringify(lockConfig));
  }

  /**
   * Persists the draft configuration via the API.
   */
  async function handleSave(): Promise<void> {
    setRequestState('saving');
    try {
      const res = await fetch(`/api/v1/tenants/${tenantId}/ui-mode-lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftConfig),
      });

      if (!res.ok) {
        setRequestState('error');
        return;
      }

      setLockConfig(draftConfig);
      setIsDirty(false);
      setRequestState('success');
    } catch {
      setRequestState('error');
    }
  }

  // ── Access denied guard ─────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <Scene className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="mx-auto max-w-sm text-center">
          <p className="mb-2 text-4xl" aria-hidden>🔒</p>
          <h1 className="mb-2 font-display text-2xl uppercase tracking-widest text-glow-primary">
            Access Denied
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            This page is only accessible to administrators and teachers.
          </p>
          <GameButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/g/settings')}
            aria-label="Back to settings"
          >
            ← Back to Settings
          </GameButton>
        </div>
      </Scene>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <Scene className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <Logo withText={false} />
          <GameButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/g/settings')}
            aria-label="Back to settings"
          >
            ← Back
          </GameButton>
        </header>

        <h1 className="mb-2 font-display text-3xl uppercase tracking-widest text-glow-primary">
          Organisation Settings
        </h1>
        <p className="mb-8 text-sm text-muted-foreground tracking-wider">
          Manage the default UI mode for all users in your organisation.
        </p>

        {/* Loading state */}
        {requestState === 'loading' && (
          <p className="text-sm text-muted-foreground italic">Loading organisation settings…</p>
        )}

        {/* Config card */}
        {requestState !== 'loading' && (
          <section
            aria-labelledby="lock-heading"
            className="rounded-2xl border border-primary/30 bg-card/80 p-6"
          >
            <h2
              id="lock-heading"
              className="mb-1 font-display text-base uppercase tracking-widest text-foreground"
            >
              UI Mode Lock
            </h2>
            <p className="mb-6 text-xs text-muted-foreground">
              When locked, all users in your organisation will see the selected mode and
              cannot change it themselves.
            </p>

            {/* Lock toggle */}
            <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-card/40 px-5 py-4">
              <div>
                <p className="font-display text-sm uppercase tracking-wider text-foreground">
                  Lock UI mode
                </p>
                <p className="text-xs text-muted-foreground">
                  Prevent users from changing the interface mode
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draftConfig.locked}
                aria-label={draftConfig.locked ? 'Disable UI mode lock' : 'Enable UI mode lock'}
                disabled={requestState === 'saving'}
                onClick={() => handleLockToggle(!draftConfig.locked)}
                className={[
                  'relative h-7 w-12 rounded-full border transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  draftConfig.locked
                    ? 'border-primary bg-primary'
                    : 'border-primary/30 bg-card',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className={[
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                    draftConfig.locked ? 'translate-x-5' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </div>

            {/* Mode selection (only when lock is enabled) */}
            {draftConfig.locked && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-display uppercase tracking-wider text-muted-foreground">
                  Locked mode
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <AdminModeButton
                    mode="normal"
                    label="Normal"
                    icon="📖"
                    selected={draftConfig.mode === 'normal'}
                    disabled={requestState === 'saving'}
                    onSelect={handleModeSelect}
                  />
                  <AdminModeButton
                    mode="gamified"
                    label="Gamified"
                    icon="⚔️"
                    selected={draftConfig.mode === 'gamified'}
                    disabled={requestState === 'saving'}
                    onSelect={handleModeSelect}
                  />
                </div>
              </div>
            )}

            {/* Warning text */}
            {draftConfig.locked && draftConfig.mode && (
              <div
                role="note"
                className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-300"
              >
                <strong className="block mb-1 font-display uppercase tracking-wider">
                  Impact warning
                </strong>
                All users in your organisation will immediately see the{' '}
                <strong className="capitalize">{draftConfig.mode}</strong> interface. They will
                not be able to change it until you disable the lock.
              </div>
            )}

            {/* Save button */}
            <GameButton
              variant="primary"
              size="md"
              disabled={!isDirty || requestState === 'saving' || (draftConfig.locked && !draftConfig.mode)}
              onClick={() => void handleSave()}
              aria-label="Save organisation settings"
              className="w-full"
            >
              {requestState === 'saving' ? 'Saving…' : 'Save Settings'}
            </GameButton>

            {/* Feedback messages */}
            {requestState === 'success' && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-xs text-green-400"
              >
                Organisation settings saved successfully.
              </p>
            )}

            {requestState === 'error' && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive"
              >
                Failed to save settings — please try again.
              </p>
            )}
          </section>
        )}

      </div>
    </Scene>
  );
}

// ── AdminModeButton sub-component ─────────────────────────────────────────────

interface AdminModeButtonProps {
  /** The UI mode this button represents */
  mode: UiMode;
  /** Display label */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Whether this mode is the currently selected draft mode */
  selected: boolean;
  /** Whether the button is disabled */
  disabled: boolean;
  /** Callback invoked when this mode is selected */
  onSelect: (mode: UiMode) => void;
}

/**
 * Compact mode-selection button for the admin lock configuration panel.
 *
 * @param props.mode - The UI mode this button represents
 * @param props.label - Text label to display
 * @param props.icon - Emoji icon
 * @param props.selected - Whether this option is selected
 * @param props.disabled - Whether the button is interactive
 * @param props.onSelect - Selection handler
 * @returns A styled toggle button for mode selection
 */
function AdminModeButton({ mode, label, icon, selected, disabled, onSelect }: AdminModeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`Lock to ${label} mode`}
      disabled={disabled}
      onClick={() => onSelect(mode)}
      className={[
        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:pointer-events-none',
        selected
          ? 'border-primary bg-primary/20 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.5)]'
          : 'border-primary/20 bg-card/40 hover:border-primary/50',
      ].join(' ')}
    >
      <span className="text-xl" aria-hidden>{icon}</span>
      <span className="font-display text-sm uppercase tracking-wider text-foreground">{label}</span>
    </button>
  );
}
