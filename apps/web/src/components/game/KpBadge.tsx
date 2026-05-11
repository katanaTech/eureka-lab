'use client';

import { Brain, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryStore } from '@/stores/inventory-store';

interface KpBadgeProps {
  /** Additional class names for the badge wrapper */
  className?: string;
}

/**
 * Displays the player's current and lifetime Knowledge Points (KP) balance.
 * Reads from the inventory Zustand store — hydrated by the backend via setInventory().
 *
 * @param props.className - Optional extra CSS classes
 * @returns A panel badge showing current KP and lifetime KP earned
 */
export function KpBadge({ className }: KpBadgeProps) {
  const { kp, totalKpEarned } = useInventoryStore();

  return (
    <div className={cn('panel inline-flex items-center gap-2 px-3 py-1.5', className)}>
      <Brain className="h-4 w-4 text-accent" aria-hidden />
      <div className="leading-tight">
        <div className="font-display text-sm text-glow-gold">
          {kp} <span className="text-[10px] text-muted-foreground">KP</span>
        </div>
        <div className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
          Lifetime {totalKpEarned}
        </div>
      </div>
      <Coins className="h-3.5 w-3.5 text-accent/70 ml-1" aria-hidden />
    </div>
  );
}
