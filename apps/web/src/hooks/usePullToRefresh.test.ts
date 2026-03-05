import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePullToRefresh } from './usePullToRefresh';

/**
 * Polyfill Touch for jsdom (not available natively).
 * Only defines the properties needed by usePullToRefresh.
 */
class MockTouch {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;

  constructor(init: TouchInit) {
    this.identifier = init.identifier;
    this.target = init.target;
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
    this.pageX = init.pageX ?? 0;
    this.pageY = init.pageY ?? 0;
    this.screenX = init.screenX ?? 0;
    this.screenY = init.screenY ?? 0;
    this.radiusX = init.radiusX ?? 0;
    this.radiusY = init.radiusY ?? 0;
    this.rotationAngle = init.rotationAngle ?? 0;
    this.force = init.force ?? 0;
  }
}

/* Install polyfill */
(globalThis as unknown as Record<string, unknown>).Touch = MockTouch;

describe('usePullToRefresh', () => {
  let onRefresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRefresh = vi.fn().mockResolvedValue(undefined);
  });

  it('should return initial state with zero pull distance', () => {
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.isPulled).toBe(false);
    expect(result.current.containerRef).toBeDefined();
  });

  it('should expose a containerRef starting as null', () => {
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    expect(result.current.containerRef.current).toBeNull();
  });

  it('should have isPulled false when pullDistance is 0', () => {
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    /* PULL_THRESHOLD is 60, pullDistance starts at 0 */
    expect(result.current.isPulled).toBe(false);
  });

  it('should not be refreshing initially', () => {
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    expect(result.current.isRefreshing).toBe(false);
  });

  it('should return a stable containerRef across re-renders', () => {
    const { result, rerender } = renderHook(() => usePullToRefresh(onRefresh));

    const firstRef = result.current.containerRef;
    rerender();
    const secondRef = result.current.containerRef;

    expect(firstRef).toBe(secondRef);
  });

  it('should accept an async onRefresh callback', () => {
    const asyncRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh(asyncRefresh));

    expect(result.current).toBeDefined();
    expect(result.current.pullDistance).toBe(0);
  });
});
