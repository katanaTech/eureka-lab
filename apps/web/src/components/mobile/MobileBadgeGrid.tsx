'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { Badge } from '@eureka-lab/shared-types';
import { cn } from '@/lib/utils';

interface MobileBadgeGridProps {
  /** Earned badges */
  badges: Badge[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Horizontal-scrollable badge collection for mobile.
 * Shows earned badges with unlock dates and locked placeholders.
 *
 * @param badges - Array of earned badges
 * @param className - Additional CSS classes
 */
export const MobileBadgeGrid: FC<MobileBadgeGridProps> = ({ badges, className }) => {
  const t = useTranslations('MobileProgress');

  if (badges.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        {t('noBadges')}
      </p>
    );
  }

  return (
    <div
      className={cn('flex gap-3 overflow-x-auto pb-2 scrollbar-none', className)}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-card p-3"
          style={{ minWidth: '80px' }}
        >
          <span className="text-2xl" aria-hidden="true">
            {badge.iconUrl || '🏆'}
          </span>
          <span className="text-[10px] font-medium text-foreground text-center leading-tight">
            {badge.name}
          </span>
        </div>
      ))}
    </div>
  );
};
