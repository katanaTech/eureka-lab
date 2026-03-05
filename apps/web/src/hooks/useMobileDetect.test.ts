import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

/* Reset the module-level cache between tests */
let useMobileDetect: typeof import('./useMobileDetect').useMobileDetect;

describe('useMobileDetect', () => {
  let originalInnerWidth: number;

  beforeEach(async () => {
    originalInnerWidth = window.innerWidth;

    /* Mock matchMedia */
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    /* Ensure ontouchstart does NOT exist */
    if ('ontouchstart' in window) {
      delete (window as Record<string, unknown>)['ontouchstart'];
    }
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true,
    });

    /* Re-import to reset module-level cached state */
    vi.resetModules();
    const mod = await import('./useMobileDetect');
    useMobileDetect = mod.useMobileDetect;
  });

  it('should detect desktop viewport (width >= 768)', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetect());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isPwa).toBe(false);
    expect(result.current.isTouchDevice).toBe(false);
  });

  it('should detect mobile viewport (width < 768)', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetect());

    expect(result.current.isMobile).toBe(true);
  });

  it('should detect touch device via maxTouchPoints', async () => {
    vi.resetModules();

    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      writable: true,
      configurable: true,
    });

    const mod = await import('./useMobileDetect');
    const { result } = renderHook(() => mod.useMobileDetect());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('should detect touch device via ontouchstart', async () => {
    vi.resetModules();

    /* Setting ontouchstart to null makes 'ontouchstart' in window === true */
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true,
      configurable: true,
    });

    const mod = await import('./useMobileDetect');
    const { result } = renderHook(() => mod.useMobileDetect());

    expect(result.current.isTouchDevice).toBe(true);
  });

  it('should update on window resize', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useMobileDetect());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isMobile).toBe(true);
  });

  it('should return a valid shape with all three properties', () => {
    const { result } = renderHook(() => useMobileDetect());

    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isPwa');
    expect(result.current).toHaveProperty('isTouchDevice');
  });
});
