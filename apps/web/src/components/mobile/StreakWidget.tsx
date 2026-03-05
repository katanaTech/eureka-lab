'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakWidgetProps {
  /** Current streak day count */
  current: number;
  /** Longest streak ever */
  longest: number;
  /** Whether a streak freeze is available */
  freezeAvailable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact streak widget card for the mobile home page.
 * Fire emoji + day count + longest streak subtitle.
 * Flame animation intensity scales with streak length.
 *
 * @param current - Current streak count
 * @param longest - Longest streak count
 * @param freezeAvailable - Whether a freeze is available
 * @param className - Additional CSS classes
 */
export const StreakWidget: FC<StreakWidgetProps> = ({
  current,
  longest,
  freezeAvailable = false,
  className,
}) => {
  const t = useTranslations('MobileHome');

  /** Flame intensity based on streak length */
  const flameClass = current >= 14
    ? 'animate-pulse text-orange-500'
    : current >= 7
      ? 'animate-bounce text-orange-500'
      : 'text-orange-400';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card p-4',
        className,
      )}
    >
      <Flame
        className={cn('h-10 w-10 shrink-0', flameClass)}
        aria-hidden="true"
      />
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{current}</span>
          <span className="text-sm text-muted-foreground">{t('dayStreak')}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('longest')}: {longest} {t('dayStreak')}
        </p>
        {freezeAvailable && (
          <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            Freeze available
          </span>
        )}
      </div>
    </div>
  );
};
