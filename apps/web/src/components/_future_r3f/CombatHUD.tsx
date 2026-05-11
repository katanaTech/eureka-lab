'use client';

interface HpBarProps {
  /** Current HP value */
  current: number;
  /** Maximum HP value */
  max: number;
  /** Display label (e.g. "You" or zombie name) */
  label: string;
  /** Tailwind background colour class for the fill */
  color: string;
  /** Use smaller height for mobile layout */
  compact?: boolean;
}

/**
 * A single labelled HP bar with CSS transition on fill changes.
 *
 * @param current - Current HP
 * @param max - Maximum HP
 * @param label - Name displayed above bar
 * @param color - Tailwind bg class for the fill (e.g. "bg-green-500")
 * @param compact - Render thinner bar for mobile
 */
function HpBar({ current, max, label, color, compact }: HpBarProps) {
  const pct = Math.max(0, Math.round((current / max) * 100));
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span className="font-semibold">{label}</span>
        <span className="font-mono">{current}/{max}</span>
      </div>
      <div className={`overflow-hidden rounded-full bg-gray-700 ${compact ? 'h-2.5' : 'h-3'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface CombatHUDProps {
  /** Player's current HP */
  playerHp: number;
  /** Player's maximum HP */
  playerMaxHp: number;
  /** Zombie's current HP */
  zombieHp: number;
  /** Zombie's maximum HP */
  zombieMaxHp: number;
  /** Zombie display name for its HP bar label */
  zombieName: string;
  /** Render compact (thinner, tighter) for mobile layout */
  compact?: boolean;
}

/**
 * Two-column HP bar display for both combatants.
 * Used by both the desktop 3D battle page and the mobile 2D battle view.
 *
 * @param playerHp - Player's current hit points
 * @param playerMaxHp - Player's maximum hit points
 * @param zombieHp - Zombie's current hit points
 * @param zombieMaxHp - Zombie's maximum hit points
 * @param zombieName - Label shown on the zombie HP bar
 * @param compact - Use mobile-optimised sizing when true
 */
export function CombatHUD({
  playerHp,
  playerMaxHp,
  zombieHp,
  zombieMaxHp,
  zombieName,
  compact = false,
}: CombatHUDProps) {
  return (
    <div className={`flex gap-4 ${compact ? 'px-4 pt-2' : 'px-6 pb-2 pt-6'}`}>
      <HpBar
        current={playerHp}
        max={playerMaxHp}
        label="You"
        color="bg-green-500"
        compact={compact}
      />
      <HpBar
        current={zombieHp}
        max={zombieMaxHp}
        label={zombieName}
        color="bg-red-500"
        compact={compact}
      />
    </div>
  );
}
