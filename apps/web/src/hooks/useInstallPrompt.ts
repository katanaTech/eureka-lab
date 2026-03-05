'use client';

import { useState, useEffect, useCallback } from 'react';

/** localStorage key for tracking visit count */
const VISIT_COUNT_KEY = 'pwa_visit_count';

/** localStorage key for tracking dismiss timestamp */
const DISMISS_KEY = 'pwa_install_dismissed';

/** Days to hide banner after dismissal */
const DISMISS_DAYS = 7;

/** Return value of useInstallPrompt hook */
export interface UseInstallPromptResult {
  /** Whether the install prompt can be shown */
  canInstall: boolean;
  /** Trigger the browser install prompt */
  install: () => Promise<boolean>;
  /** Dismiss the install banner (hides for 7 days) */
  dismiss: () => void;
  /** Whether the banner has been dismissed recently */
  isDismissed: boolean;
}

/**
 * Hook for managing the PWA install prompt.
 * Captures the `beforeinstallprompt` event and provides install/dismiss controls.
 * Shows prompt after 2nd visit, hides for 7 days after dismissal.
 *
 * @returns Install prompt state and control functions
 */
export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [visitCount, setVisitCount] = useState(0);

  /** Track visits and check dismiss state on mount */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* Increment visit count */
    try {
      const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0', 10) + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(count));
      setVisitCount(count);
    } catch {
      /* localStorage not available */
    }

    /* Check if banner was dismissed recently */
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const dismissDate = new Date(dismissedAt);
        const daysSince = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
        setIsDismissed(daysSince < DISMISS_DAYS);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  /** Listen for the beforeinstallprompt event */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /**
     * Handle the beforeinstallprompt event.
     * @param e - The deferred install prompt event
     */
    function handleBeforeInstallPrompt(e: Event): void {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    /** Handle the appinstalled event — clear prompt after install */
    function handleAppInstalled(): void {
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /** Whether we can show the install prompt (after 2nd visit, not dismissed, prompt available) */
  const canInstall = deferredPrompt !== null && visitCount >= 2 && !isDismissed;

  /**
   * Trigger the browser install prompt.
   * @returns True if user accepted the install
   */
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    return result.outcome === 'accepted';
  }, [deferredPrompt]);

  /**
   * Dismiss the install banner for 7 days.
   */
  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      /* localStorage not available */
    }
  }, []);

  return { canInstall, install, dismiss, isDismissed };
}

/**
 * BeforeInstallPromptEvent interface — not yet in standard TypeScript DOM types.
 */
interface BeforeInstallPromptEvent extends Event {
  /** Show the install prompt */
  prompt: () => void;
  /** Promise resolving to the user's choice */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
