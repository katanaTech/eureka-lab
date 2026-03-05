/**
 * Level badge — small inline badge showing current XP level.
 *
 * @module LevelBadge
 */

'use client';

import { getXpLevel } from '@eureka-lab/shared-types';

/** Props for the LevelBadge component */
interface LevelBadgeProps {
  /** Total XP to derive level from */
  xp: number;
}

/**
 * Small inline badge showing XP level icon and name.
 * @param props - Component props
 * @returns Level badge element
 */
export function LevelBadge({ xp }: LevelBadgeProps) {
  const level = getXpLevel(xp);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
      title={`${level.name} (${xp} XP)`}
    >
      <span role="img" aria-hidden="true">
        {level.icon}
      </span>
      {level.name}
    </span>
  );
}
