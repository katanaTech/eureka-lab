'use client';

import { useSyncExternalStore } from 'react';

/**
 * Subscribe to browser online/offline events.
 * @param callback - Function called when online status changes
 * @returns Cleanup function that removes the event listeners
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Get current online status from the browser.
 * @returns True if the browser reports being online
 */
function getSnapshot(): boolean {
  return navigator.onLine;
}

/**
 * Server-side snapshot always returns true (assume online during SSR).
 * @returns True
 */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * React hook that tracks browser online/offline status.
 * Uses useSyncExternalStore for tear-free reads of navigator.onLine.
 * @returns True if the browser is online, false if offline
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
