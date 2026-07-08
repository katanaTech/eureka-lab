'use client';

import Image from 'next/image';
import { cn } from '../lib/cn';

interface LogoProps {
  /** Additional class names for the wrapper */
  className?: string;
  /** Whether to render the brand text alongside the emblem. Defaults to true. */
  withText?: boolean;
  /** Tagline shown under "EUREKA LAB". Defaults to the game's tagline. */
  tagline?: string;
}

/**
 * Eureka Lab brand logo with animated glow effect.
 * @param props.className - Optional extra CSS classes
 * @param props.withText - Show brand text alongside the emblem (default: true)
 * @param props.tagline - Tagline shown under "EUREKA LAB" (default: "QUEST FOR AI MASTERY")
 * @returns A flex row containing the logo image and optional brand text
 */
export function Logo({ className, withText = true, tagline = 'QUEST FOR AI MASTERY' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/assets/game/logo.png"
        alt="Eureka Lab emblem"
        width={48}
        height={48}
        className="h-12 w-12 animate-pulse-glow"
      />
      {withText && (
        <div className="leading-none">
          <div className="font-display text-2xl text-glow-primary">EUREKA LAB</div>
          <div className="text-[10px] tracking-[0.4em] text-primary/80">{tagline}</div>
        </div>
      )}
    </div>
  );
}
