'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { ModuleListItem } from '@/lib/api-client';
import { UpgradeBanner } from '@/components/features/payments/UpgradeBanner';
import { cn } from '@/lib/utils';

interface ModuleListProps {
  /** Array of modules to display */
  modules: ModuleListItem[];
  /** Whether the list is still loading */
  isLoading?: boolean;
}

/**
 * Grid list of learning modules with status badges.
 * Each card shows title, description, XP, and status.
 *
 * @param modules - Array of module items
 * @param isLoading - Whether data is loading
 */
export const ModuleList: FC<ModuleListProps> = ({ modules, isLoading }) => {
  const t = useTranslations('Learn');

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg border border-border bg-muted/30"
          />
        ))}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No modules available yet.
      </div>
    );
  }

  /* Check if any locked module requires a paid plan */
  const lockedPaidPlans = modules
    .filter((m) => m.status === 'locked' && m.requiredPlan !== 'free')
    .map((m) => m.requiredPlan);
  const uniqueLockedPlans = [...new Set(lockedPaidPlans)];

  return (
    <div className="space-y-4">
      {/* Upgrade banner for locked paid modules */}
      {uniqueLockedPlans.length > 0 && (
        <UpgradeBanner requiredPlan={uniqueLockedPlans[0]} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <ModuleCard key={mod.id} module={mod} />
        ))}
      </div>
    </div>
  );
};

/* ── Module Card ────────────────────────────────────────────── */

interface ModuleCardProps {
  /** Module data */
  module: ModuleListItem;
}

/**
 * Individual module card with click navigation.
 *
 * @param module - Module list item data
 */
const ModuleCard: FC<ModuleCardProps> = ({ module: mod }) => {
  const t = useTranslations('Learn');
  const router = useRouter();
  const isLocked = mod.status === 'locked';

  /**
   * Handle card click — navigate to module detail.
   */
  const handleClick = () => {
    if (!isLocked) {
      router.push(`/learn/${mod.id}`);
    }
  };

  /** Status badge styling */
  const statusStyles: Record<string, string> = {
    locked: 'bg-muted text-muted-foreground',
    available: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };

  /** Status label mapping */
  const statusLabels: Record<string, string> = {
    locked: t('locked'),
    available: t('available'),
    in_progress: t('inProgress'),
    completed: t('completed'),
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLocked}
      className={cn(
        'group flex h-full flex-col rounded-lg border border-border bg-background p-5 text-left transition-all',
        isLocked
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:border-primary/50 hover:shadow-md',
      )}
      aria-label={`Module: ${mod.title} — ${statusLabels[mod.status]}`}
    >
      {/* Header: Level badge + Status */}
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {t('levelTitle', { level: mod.level })}
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            statusStyles[mod.status],
          )}
        >
          {statusLabels[mod.status]}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-base font-semibold text-foreground group-hover:text-primary">
        {mod.title}
      </h3>

      {/* Description */}
      <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">
        {mod.description}
      </p>

      {/* Footer: Time + XP */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{mod.estimatedMinutes} min</span>
        <span>{mod.xpReward} XP</span>
        {mod.requiredPlan !== 'free' && (
          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase">
            {mod.requiredPlan}
          </span>
        )}
      </div>
    </button>
  );
};
