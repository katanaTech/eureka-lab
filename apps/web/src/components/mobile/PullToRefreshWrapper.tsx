'use client';

import { type FC, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshWrapperProps {
  /** Async callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Child content */
  children: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Pull-to-refresh wrapper component for mobile pages.
 * Wraps content in a touch-enabled scroll container with a
 * spinner indicator that shows during the pull gesture.
 *
 * @param onRefresh - Async callback to invoke on refresh
 * @param children - Scrollable content
 * @param className - Additional CSS classes
 */
export const PullToRefreshWrapper: FC<PullToRefreshWrapperProps> = ({
  onRefresh,
  children,
  className,
}) => {
  const { containerRef, pullDistance, isRefreshing, isPulled } =
    usePullToRefresh(onRefresh);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto overscroll-none', className)}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
          style={{ height: `${pullDistance}px` }}
        >
          <Loader2
            className={cn(
              'h-5 w-5 text-primary transition-all',
              isRefreshing && 'animate-spin',
              isPulled && !isRefreshing && 'scale-110 text-primary',
              !isPulled && 'scale-75 text-muted-foreground',
            )}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Content — shifted down by pull distance */}
      {children}
    </div>
  );
};
