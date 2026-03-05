'use client';

import { useCallback } from 'react';

/**
 * Hook for triggering haptic feedback on supported devices.
 * Uses the Vibration API (navigator.vibrate) which is available
 * on most Android devices and some iOS PWAs.
 *
 * @returns Object with light, medium, and heavy haptic feedback functions
 */
export function useHapticFeedback() {
  /** Whether the Vibration API is available */
  const isSupported =
    typeof window !== 'undefined' && 'vibrate' in navigator;

  /**
   * Light haptic feedback — for button taps.
   * 10ms vibration.
   */
  const light = useCallback(() => {
    if (isSupported) navigator.vibrate(10);
  }, [isSupported]);

  /**
   * Medium haptic feedback — for action completions.
   * 25ms vibration.
   */
  const medium = useCallback(() => {
    if (isSupported) navigator.vibrate(25);
  }, [isSupported]);

  /**
   * Heavy haptic feedback — for celebrations and milestones.
   * Pattern: 25ms on, 50ms off, 25ms on.
   */
  const heavy = useCallback(() => {
    if (isSupported) navigator.vibrate([25, 50, 25]);
  }, [isSupported]);

  return { isSupported, light, medium, heavy };
}
