'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Zap, Lock, CheckCircle2, Play } from 'lucide-react';
import type { ModuleListItem } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface MobileModuleCardProps {
  /** Module data */
  module: ModuleListItem;
}

/**
 * Compact mobile module card for the learn page.
 * Shows title, status badge, progress indicator, XP reward, and estimated time.
 *
 * @param module - Module data from the API
 */
export const MobileModuleCard: FC<MobileModuleCardProps> = ({ module }) => {
  const t = useTranslations('Learn');

  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isInProgress = module.status === 'in_progress';

  /** Status icon and color mapping */
  const statusConfig = {
    locked: { icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted/50' },
    available: { icon: Play, color: 'text-primary', bg: 'bg-card' },
    in_progress: { icon: Play, color: 'text-blue-500', bg: 'bg-card' },
    completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-card' },
  };

  const config = statusConfig[module.status];
  const StatusIcon = config.icon;

  return (
    <a
      href={isLocked ? undefined : `/m/learn/${module.id}`}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border p-3 transition-colors',
        config.bg,
        isLocked ? 'cursor-not-allowed opacity-60' : 'hover:bg-accent',
      )}
      aria-disabled={isLocked}
    >
      {/* Status icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isCompleted ? 'bg-green-100' : isInProgress ? 'bg-blue-100' : 'bg-muted',
        )}
      >
        <StatusIcon className={cn('h-5 w-5', config.color)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{module.title}</p>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {module.estimatedMinutes} {t('minutes')}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" aria-hidden="true" />
            {module.xpReward} XP
          </span>
        </div>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
          isCompleted && 'bg-green-100 text-green-700',
          isInProgress && 'bg-blue-100 text-blue-700',
          module.status === 'available' && 'bg-primary/10 text-primary',
          isLocked && 'bg-muted text-muted-foreground',
        )}
      >
        {t(module.status)}
      </span>
    </a>
  );
};
