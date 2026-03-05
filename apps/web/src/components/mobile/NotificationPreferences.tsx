'use client';

import { type FC, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellOff, Flame, Trophy, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { notificationsApi } from '@/lib/api-client';
import type { NotificationPreferences as Prefs } from '@eureka-lab/shared-types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@eureka-lab/shared-types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/**
 * Notification preferences panel for mobile profile page.
 * Manages push subscription and per-notification-type toggle cards.
 * COPPA: Child notifications require parent opt-in (shown as info message).
 */
export const NotificationPreferences: FC = () => {
  const t = useTranslations('Notifications');
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [prefsLoading, setPrefsLoading] = useState(true);

  /** Fetch preferences on mount */
  const fetchPrefs = useCallback(async () => {
    try {
      const data = await notificationsApi.getPreferences();
      setPrefs(data);
    } catch {
      /* Use defaults */
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  /**
   * Toggle a specific preference.
   * @param key - Preference key to toggle
   */
  async function togglePref(key: keyof Prefs): Promise<void> {
    const currentValue = prefs[key];
    if (typeof currentValue !== 'boolean') return;

    const updated = { [key]: !currentValue };
    setPrefs((prev) => ({ ...prev, ...updated }));
    try {
      await notificationsApi.updatePreferences(updated);
    } catch {
      /* Revert on error */
      setPrefs((prev) => ({ ...prev, [key]: currentValue }));
    }
  }

  /**
   * Handle the main push notification toggle.
   */
  async function handleMainToggle(): Promise<void> {
    if (isSubscribed) {
      await unsubscribe();
      await notificationsApi.updatePreferences({ notificationsEnabled: false });
      setPrefs((prev) => ({ ...prev, notificationsEnabled: false }));
    } else {
      const success = await subscribe();
      if (success) {
        await notificationsApi.updatePreferences({ notificationsEnabled: true });
        setPrefs((prev) => ({ ...prev, notificationsEnabled: true }));
      }
    }
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <BellOff className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 text-sm text-muted-foreground">{t('notSupported')}</p>
      </div>
    );
  }

  /** COPPA info for child accounts */
  const isChild = user?.role === 'child';

  /** Toggle item definition */
  type ToggleItem = {
    key: keyof Prefs;
    icon: typeof Flame;
    label: string;
    color: string;
  };

  /** Toggle items */
  const toggleItems: ToggleItem[] = [
    { key: 'streakReminders', icon: Flame, label: t('streakReminders'), color: 'text-orange-500' },
    { key: 'newBadges', icon: Trophy, label: t('newBadges'), color: 'text-yellow-500' },
    { key: 'weeklyReport', icon: BarChart3, label: t('weeklyReport'), color: 'text-blue-500' },
  ];

  /** Add parent-specific toggle */
  if (user?.role === 'parent') {
    toggleItems.push({
      key: 'parentAlerts',
      icon: Shield,
      label: t('parentAlerts'),
      color: 'text-green-500',
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t('pushNotifications')}</p>
            <p className="text-xs text-muted-foreground">
              {permission === 'denied' ? t('permissionDenied') : t('pushDescription')}
            </p>
          </div>
        </div>
        <Button
          variant={isSubscribed ? 'default' : 'outline'}
          size="sm"
          onClick={handleMainToggle}
          disabled={isLoading || permission === 'denied'}
        >
          {isLoading ? '...' : isSubscribed ? t('enabled') : t('enable')}
        </Button>
      </div>

      {/* COPPA notice for children */}
      {isChild && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">{t('coppaNotice')}</p>
        </div>
      )}

      {/* Individual toggles (only if push is enabled) */}
      {isSubscribed && !prefsLoading && (
        <div className="rounded-xl border border-border bg-card">
          {toggleItems.map(({ key, icon: Icon, label, color }, idx) => (
            <button
              key={key}
              onClick={() => togglePref(key)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 text-left',
                idx < toggleItems.length - 1 && 'border-b border-border',
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
                <span className="text-sm text-foreground">{label}</span>
              </div>
              <div
                className={cn(
                  'h-5 w-9 rounded-full transition-colors',
                  prefs[key] ? 'bg-primary' : 'bg-muted',
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
                    prefs[key] ? 'translate-x-[18px]' : 'translate-x-0.5',
                  )}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
