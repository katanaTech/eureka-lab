import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useInstallPrompt } from './useInstallPrompt';

describe('useInstallPrompt', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    /* Mock localStorage with a real in-memory store */
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => store[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        store[key] = value;
      },
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete store[key];
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return canInstall=false when no prompt event fired', () => {
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
  });

  it('should track visit count in localStorage', () => {
    renderHook(() => useInstallPrompt());

    expect(store['pwa_visit_count']).toBe('1');
  });

  it('should increment visit count on subsequent visits', () => {
    store['pwa_visit_count'] = '3';

    renderHook(() => useInstallPrompt());

    expect(store['pwa_visit_count']).toBe('4');
  });

  it('should not show canInstall on first visit even with prompt event', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    /* Wait for useEffect to complete */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    /* Simulate beforeinstallprompt */
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    /* Still can't install on first visit (count=1, need >= 2) */
    expect(result.current.canInstall).toBe(false);
  });

  it('should show canInstall on 2nd visit with prompt event', async () => {
    store['pwa_visit_count'] = '1'; /* Will become 2 after increment */

    const { result } = renderHook(() => useInstallPrompt());

    /* Wait for useEffect */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    /* Simulate beforeinstallprompt */
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('should dismiss for 7 days when dismiss() is called', async () => {
    store['pwa_visit_count'] = '2';

    const { result } = renderHook(() => useInstallPrompt());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    /* Simulate beforeinstallprompt */
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);

    /* Dismiss */
    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(result.current.canInstall).toBe(false);
    expect(store['pwa_install_dismissed']).toBeDefined();
  });

  it('should not show canInstall when dismissed within 7 days', async () => {
    /* Set dismiss time to 1 hour ago as ISO string (matching how dismiss() stores it) */
    const recentDismiss = new Date(Date.now() - 1000 * 60 * 60);
    store['pwa_visit_count'] = '5';
    store['pwa_install_dismissed'] = recentDismiss.toISOString();

    const { result } = renderHook(() => useInstallPrompt());

    /* Wait for useEffect to read localStorage */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    /* Simulate beforeinstallprompt */
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    expect(result.current.isDismissed).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('should show canInstall after 7-day dismissal expires', async () => {
    const oldDismiss = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8); /* 8 days ago */
    store['pwa_visit_count'] = '5';
    store['pwa_install_dismissed'] = oldDismiss.toISOString();

    const { result } = renderHook(() => useInstallPrompt());

    /* Wait for useEffect */
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    /* Simulate beforeinstallprompt */
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    expect(result.current.isDismissed).toBe(false);
    expect(result.current.canInstall).toBe(true);
  });

  it('should call install() and return accepted result', async () => {
    store['pwa_visit_count'] = '5';

    const { result } = renderHook(() => useInstallPrompt());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    /* Create mock prompt event */
    const mockPrompt = vi.fn();
    const mockEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => void;
      userChoice: Promise<{ outcome: string }>;
    };
    Object.defineProperty(mockEvent, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(mockEvent, 'prompt', { value: mockPrompt });
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted' }),
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    let accepted = false;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(accepted).toBe(true);
  });
});
