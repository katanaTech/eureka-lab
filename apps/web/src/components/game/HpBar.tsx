'use client';

import { cn } from '@/lib/utils';

interface HpBarProps {
  /** Current HP value (0 to max) */
  current: number;
  /** Maximum HP value */
  max: number;
  /** Optional label displayed above the bar (e.g. character name) */
  label?: string;
  /** Visual theme: 'player' uses a gradient, 'enemy' uses a red glow */
  variant?: 'player' | 'enemy';
  /** Additional class names for the root wrapper */
  className?: string;
}

/** Returns a Tailwind gradient class based on the HP percentage for the player variant. */
function getPlayerBarColor(pct: number): string {
  if (pct > 0.6) return 'from-green-500 to-green-400';
  if (pct > 0.3) return 'from-yellow-500 to-yellow-400';
  return 'from-red-600 to-red-500';
}

/**
 * Animated horizontal HP bar component.
 *
 * Player variant: gradient shifts green → yellow → red as HP falls.
 * Enemy variant: red bar with a glow effect.
 *
 * @param props.current - Current HP value
 * @param props.max - Maximum HP value
 * @param props.label - Optional text label shown above the bar
 * @param props.variant - 'player' (default) or 'enemy' visual theme
 * @param props.className - Optional extra CSS classes
 * @returns A labelled progress bar with animated fill
 */
export function HpBar({
  current,
  max,
  label,
  variant = 'player',
  className,
}: HpBarProps) {
  const clampedCurrent = Math.max(0, Math.min(current, max));
  const pct = max > 0 ? clampedCurrent / max : 0;
  const fillPercent = Math.round(pct * 100);

  const isPlayer = variant === 'player';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Label row */}
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-foreground/80">
            {label}
          </span>
          <span
            className={cn(
              'font-display text-xs',
              isPlayer ? 'text-green-400' : 'text-red-400'
            )}
            aria-label={`${clampedCurrent} out of ${max} HP`}
          >
            {clampedCurrent}
            <span className="text-muted-foreground">/{max}</span>
          </span>
        </div>
      )}

      {/* Track */}
      <div
        role="progressbar"
        aria-valuenow={clampedCurrent}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ? `${label} HP` : 'HP'}
        className={cn(
          'h-3 w-full overflow-hidden rounded-full bg-muted/60',
          isPlayer ? '' : 'shadow-[0_0_6px_1px_hsl(var(--destructive)/0.5)]'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out',
            isPlayer
              ? getPlayerBarColor(pct)
              : 'from-red-700 to-red-500 shadow-[inset_0_0_4px_hsl(0_84%_60%/0.6)]'
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Numeric display when no label is provided */}
      {!label && (
        <div
          className={cn(
            'text-right font-display text-xs',
            isPlayer ? 'text-green-400' : 'text-red-400'
          )}
          aria-hidden
        >
          {clampedCurrent}/{max}
        </div>
      )}
    </div>
  );
}
