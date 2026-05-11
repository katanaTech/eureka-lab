'use client';

import { useState, useEffect } from 'react';

interface DamageNumberProps {
  /** The HP change value (always positive — sign is applied by `type`) */
  value: number;
  /**
   * - `dealt`: player attacked the zombie (shown in yellow, prefixed ⚡)
   * - `taken`: zombie attacked the player (shown in red, prefixed 💥)
   */
  type: 'dealt' | 'taken';
}

/**
 * Floating damage number that rises and fades out over ~800 ms.
 * Mounts visible, then triggers a CSS transition to rise and fade on the next frame.
 * Re-mounts (key change) each time value/type changes so the animation restarts.
 *
 * Must be placed inside a `position: relative` container.
 * Uses `pointer-events-none` so it never blocks click events.
 *
 * @param value - Magnitude of the damage (positive integer)
 * @param type - Direction of the hit (dealt = to zombie, taken = by player)
 */
export function DamageNumber({ value, type }: DamageNumberProps) {
  const [risen, setRisen] = useState(false);

  // One tick after mount → trigger the CSS transition
  useEffect(() => {
    const id = requestAnimationFrame(() => setRisen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const label = type === 'dealt' ? `⚡ -${value}` : `💥 -${value}`;
  const colour = type === 'dealt' ? 'text-yellow-300' : 'text-red-400';

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <p
        className={`
          text-5xl font-black drop-shadow-lg
          transition-all duration-700 ease-out
          ${colour}
          ${risen ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        {label}
      </p>
    </div>
  );
}
