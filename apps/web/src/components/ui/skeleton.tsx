import { type FC } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading placeholder with pulse animation.
 * Used for content loading states.
 *
 * @param className - Additional CSS classes for sizing
 */
export const Skeleton: FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  );
};
