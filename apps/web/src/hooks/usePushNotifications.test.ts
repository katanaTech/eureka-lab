import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePushNotifications } from './usePushNotifications';

/* Mock the API client */
vi.mock('@/lib/api-client', () => ({
  notificationsApi: {
    register: vi.fn().mockResolvedValue(undefined),
    unregister: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('usePushNotifications', () => {
  const mockSubscription = {
    endpoint: 'https://push.example.com/sub/123',
    toJSON: () => ({
      endpoint: 'https://push.example.com/sub/123',
      keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };

  const mockPushManager = {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue(mockSubscription),
  };

  const mockRegistration = {
    pushManager: mockPushManager,
  };

  beforeEach(() => {
    /* Mock service worker */
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });

    /* Mock PushManager — use a function so 'PushManager' in window === true */
    (window as Record<string, unknown>)['PushManager'] = vi.fn();

    /* Mock Notification */
    (window as Record<string, unknown>)['Notification'] = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect push notification support', async () => {
    const { result } = renderHook(() => usePushNotifications());

    /* Wait for useEffect to complete */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe('default');
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should detect no support when PushManager is missing', async () => {
    delete (window as Record<string, unknown>)['PushManager'];

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.isSupported).toBe(false);
  });

  it('should detect existing subscription', async () => {
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.isSubscribed).toBe(true);
  });

  it('should return false from subscribe when not supported', async () => {
    delete (window as Record<string, unknown>)['PushManager'];

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
  });

  it('should unsubscribe successfully', async () => {
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    /* Wait for initial subscription check */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.isSubscribed).toBe(true);

    let success = false;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should handle subscribe errors gracefully', async () => {
    (window.Notification as unknown as { requestPermission: ReturnType<typeof vi.fn> })
      .requestPermission = vi.fn().mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should not subscribe without VAPID key', async () => {
    /* VAPID_PUBLIC_KEY env var is empty string by default in test */
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    /* subscribe should return false when VAPID_PUBLIC_KEY is empty */
    let success = false;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success).toBe(false);
  });
});
