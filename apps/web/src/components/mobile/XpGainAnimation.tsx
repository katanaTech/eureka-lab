'use client';

import { type FC, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface XpGainAnimationProps {
  /** XP amount to display */
  amount: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Toast-style "+25 XP" animation that floats up and fades out.
 * CSS-only animation for zero bundle cost.
 *
 * @param amount - XP amount to show
 * @param onComplete - Called when animation finishes
 */
export const XpGainAnimation: FC<XpGainAnimationProps> = ({
  amount,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed left-1/2 top-1/3 z-50 -translate-x-1/2',
        'animate-xp-float text-2xl font-bold text-primary',
      )}
      aria-live="polite"
    >
      +{amount} XP
    </div>
  );
};
