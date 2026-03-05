'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Zap } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface MobileLeaderboardProps {
  /** Leaderboard entries (top N) */
  entries: LeaderboardEntry[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Compact mobile leaderboard showing top learners.
 * Highlights top 3 with medal indicators.
 *
 * @param entries - Leaderboard entries sorted by rank
 * @param className - Additional CSS classes
 */
export const MobileLeaderboard: FC<MobileLeaderboardProps> = ({ entries, className }) => {
  const t = useTranslations('MobileProgress');

  /** Medal emoji for top 3 positions */
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        {t('noLeaderboard')}
      </p>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      {entries.map((entry) => (
        <div
          key={entry.rank}
          className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
        >
          {/* Rank / medal */}
          <span className="w-7 text-center text-sm">
            {medals[entry.rank] ?? (
              <span className="font-medium text-muted-foreground">{entry.rank}</span>
            )}
          </span>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.displayName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {entry.level.icon} {entry.level.name}
            </p>
          </div>

          {/* XP */}
          <span className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Zap className="h-3 w-3" aria-hidden="true" />
            {entry.xp}
          </span>
        </div>
      ))}
    </div>
  );
};
