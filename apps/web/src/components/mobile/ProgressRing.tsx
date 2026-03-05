'use client';

import { type FC } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  /** Progress value between 0 and 1 */
  progress: number;
  /** Ring size in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Center label text */
  label?: string;
  /** Sub-label text below the main label */
  subLabel?: string;
  /** CSS class for the progress stroke color */
  colorClass?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated circular progress ring using SVG.
 * Used for XP progress, daily goals, and completion rates.
 *
 * @param progress - Value between 0 and 1
 * @param size - Ring diameter in pixels (default 120)
 * @param strokeWidth - Ring stroke width (default 8)
 * @param label - Center text (e.g., "450 XP")
 * @param subLabel - Text below label (e.g., "AI Thinker")
 * @param colorClass - Tailwind text color class for the ring
 * @param className - Additional CSS classes
 */
export const ProgressRing: FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
  subLabel,
  colorClass = 'text-primary',
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/30"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={cn(colorClass, 'transition-all duration-700 ease-out')}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      {/* Center label */}
      {(label || subLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <span className="text-lg font-bold text-foreground">{label}</span>
          )}
          {subLabel && (
            <span className="text-[10px] text-muted-foreground">{subLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
