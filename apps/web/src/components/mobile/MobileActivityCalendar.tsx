'use client';

import { type FC } from 'react';
import type { DayActivity } from '@eureka-lab/shared-types';
import { cn } from '@/lib/utils';

interface MobileActivityCalendarProps {
  /** Daily activity data (last 30 days) */
  activities: DayActivity[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Horizontal-scrollable activity heatmap optimized for mobile.
 * Shows 30 days of activity with color intensity based on XP earned.
 *
 * @param activities - Daily activity records
 * @param className - Additional CSS classes
 */
export const MobileActivityCalendar: FC<MobileActivityCalendarProps> = ({
  activities,
  className,
}) => {
  /**
   * Get intensity class based on XP earned.
   * @param xp - XP earned on this day
   * @returns Tailwind background color class
   */
  function getIntensity(xp: number): string {
    if (xp === 0) return 'bg-muted';
    if (xp < 25) return 'bg-primary/20';
    if (xp < 50) return 'bg-primary/40';
    if (xp < 100) return 'bg-primary/60';
    return 'bg-primary';
  }

  /**
   * Format date for display.
   * @param dateStr - ISO date string
   * @returns Short day label (e.g., "Mon")
   */
  function formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
  }

  /** Ensure we have 30 days of data, padding with empty days */
  const padded: DayActivity[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const existing = activities.find((a) => a.date === dateStr);
    padded.push(existing ?? {
      date: dateStr,
      minutesActive: 0,
      promptsUsed: 0,
      activitiesCompleted: 0,
      xpEarned: 0,
    });
  }

  return (
    <div
      className={cn('overflow-x-auto scrollbar-none', className)}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex gap-1">
        {padded.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'h-6 w-6 rounded-sm',
                getIntensity(day.xpEarned),
              )}
              title={`${day.date}: ${day.xpEarned} XP`}
              aria-label={`${day.date}: ${day.xpEarned} XP earned`}
            />
            <span className="text-[8px] text-muted-foreground">
              {formatDay(day.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
