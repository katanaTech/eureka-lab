'use client';

import { useSyncExternalStore } from 'react';

/** Mobile detection result */
export interface MobileDetectResult {
  /** Whether the viewport is mobile-width (< 768px) */
  isMobile: boolean;
  /** Whether the app is running in PWA standalone mode */
  isPwa: boolean;
  /** Whether the device supports touch input */
  isTouchDevice: boolean;
}

/** Cached detection values — updated on resize and mediaquery change */
let cachedResult: MobileDetectResult = {
  isMobile: false,
  isPwa: false,
  isTouchDevice: false,
};

/** Set of listeners to notify on change */
const listeners = new Set<() => void>();

/**
 * Recalculate mobile detection values from browser APIs.
 */
function recalculate(): void {
  const isMobile = window.innerWidth < 768;
  const isPwa = window.matchMedia('(display-mode: standalone)').matches
    || (('standalone' in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone === true);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const changed =
    cachedResult.isMobile !== isMobile
    || cachedResult.isPwa !== isPwa
    || cachedResult.isTouchDevice !== isTouchDevice;

  if (changed) {
    cachedResult = { isMobile, isPwa, isTouchDevice };
    listeners.forEach((cb) => cb());
  }
}

/** Whether the module-level listeners have been attached */
let initialized = false;

/**
 * Attach global resize and display-mode listeners (once).
 */
function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  recalculate();

  window.addEventListener('resize', recalculate);
  window.matchMedia('(display-mode: standalone)').addEventListener('change', recalculate);
}

/**
 * Subscribe callback for useSyncExternalStore.
 * @param callback - Function called when mobile detection values change
 * @returns Cleanup function that removes the subscription
 */
function subscribe(callback: () => void): () => void {
  ensureInitialized();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Client-side snapshot of mobile detection result.
 * @returns Current MobileDetectResult
 */
function getSnapshot(): MobileDetectResult {
  ensureInitialized();
  return cachedResult;
}

/**
 * Server-side snapshot — defaults to non-mobile during SSR.
 * @returns Default MobileDetectResult (desktop)
 */
function getServerSnapshot(): MobileDetectResult {
  return { isMobile: false, isPwa: false, isTouchDevice: false };
}

/**
 * React hook that detects mobile viewport, PWA standalone mode, and touch capability.
 * Uses useSyncExternalStore for concurrent-safe reads.
 * @returns MobileDetectResult with isMobile, isPwa, and isTouchDevice booleans
 */
export function useMobileDetect(): MobileDetectResult {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
