'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

/** Pull-to-refresh threshold in pixels */
const PULL_THRESHOLD = 60;

/** Maximum pull distance in pixels */
const MAX_PULL = 120;

/** Return value of usePullToRefresh hook */
export interface UsePullToRefreshResult {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Current pull distance (0 = no pull) */
  pullDistance: number;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
  /** Whether the threshold has been reached */
  isPulled: boolean;
}

/**
 * Pure touch-event based pull-to-refresh hook.
 * Tracks touchstart → touchmove → touchend on a scroll container.
 * Triggers callback when pulled down 60+px at scroll top.
 *
 * @param onRefresh - Async callback to invoke on pull-to-refresh
 * @returns Pull state and container ref
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
): UsePullToRefreshResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isPulled = pullDistance >= PULL_THRESHOLD;

  /** Handle touch start — record Y position */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const touch = e.touches[0];
    if (touch) {
      touchStartY.current = touch.clientY;
    }
  }, []);

  /** Handle touch move — update pull distance */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0 || isRefreshing) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaY = touch.clientY - touchStartY.current;
    if (deltaY > 0) {
      /* Apply resistance — pulling gets harder */
      const distance = Math.min(deltaY * 0.5, MAX_PULL);
      setPullDistance(distance);
      /* Prevent default scroll when pulling */
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isRefreshing]);

  /** Handle touch end — trigger refresh or reset */
  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  /** Attach touch listeners to the container */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, pullDistance, isRefreshing, isPulled };
}
