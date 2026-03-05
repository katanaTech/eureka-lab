'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '@/lib/api-client';

/** VAPID public key from environment */
const VAPID_PUBLIC_KEY = process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY'] ?? '';

/** Push notification permission state */
export type PushPermission = 'default' | 'granted' | 'denied';

/** Return value of usePushNotifications hook */
export interface UsePushNotificationsResult {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Current notification permission state */
  permission: PushPermission;
  /** Whether user is currently subscribed */
  isSubscribed: boolean;
  /** Whether a subscription operation is in progress */
  isLoading: boolean;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
}

/**
 * Convert a base64 URL string to a Uint8Array for the applicationServerKey.
 * @param base64String - Base64 URL-encoded VAPID public key
 * @returns Uint8Array suitable for PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * React hook for managing Web Push notification subscriptions.
 * Handles permission requests, PushManager subscription, and backend registration.
 *
 * @returns Push notification state and control functions
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Check support and current subscription status on mount */
  useEffect(() => {
    const supported =
      typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window;

    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission as PushPermission);

    /** Check if already subscribed */
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(subscription !== null);
      })
      .catch(() => {
        /* SW not ready yet — not subscribed */
      });
  }, []);

  /**
   * Subscribe to push notifications.
   * 1. Request notification permission
   * 2. Subscribe via PushManager
   * 3. Register subscription with backend
   *
   * @returns True if subscription succeeded
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;

    setIsLoading(true);
    try {
      /** Step 1: Request permission */
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);

      if (result !== 'granted') {
        setIsLoading(false);
        return false;
      }

      /** Step 2: Subscribe via PushManager */
      const registration = await navigator.serviceWorker.ready;
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });

      /** Step 3: Register with backend */
      const subJson = subscription.toJSON();
      const keys = subJson.keys as Record<string, string> | undefined;

      await notificationsApi.register({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys?.['p256dh'] ?? '',
          auth: keys?.['auth'] ?? '',
        },
        platform: 'web',
      });

      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Unsubscribe from push notifications.
   * 1. Unsubscribe via PushManager
   * 2. Unregister from backend
   *
   * @returns True if unsubscription succeeded
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        /** Unregister from backend first */
        await notificationsApi.unregister(subscription.endpoint);
        /** Then unsubscribe locally */
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
