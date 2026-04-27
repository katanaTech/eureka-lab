'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SceneProps {
  children: ReactNode;
  /** Additional class names for the root wrapper */
  className?: string;
  /** Optional background image URL. Next/Image integration is Sprint D work. */
  background?: string;
}

/**
 * Full-screen scene wrapper with vignette, CRT scanlines, and floating ember particles.
 *
 * @param props.children - Content to render inside the scene
 * @param props.className - Optional extra CSS classes
 * @param props.background - Optional background image URL
 * @returns A full-viewport div with layered atmospheric effects
 */
export function Scene({ children, className, background }: SceneProps) {
  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden', className)}>
      {background && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center animate-flicker"
          style={{ backgroundImage: `url(${background})` }}
          aria-hidden
        />
      )}
      {/* Gradient overlay for readability */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/80 to-background pointer-events-none"
        aria-hidden
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.95) 100%)',
        }}
        aria-hidden
      />
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 -z-10 scanlines pointer-events-none opacity-40"
        aria-hidden
      />
      {/* Floating ember particles */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-primary/60"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 91) % 100}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              filter: 'blur(1px)',
              animation: `float-slow ${4 + (i % 5)}s ease-in-out ${i * 0.3}s infinite`,
              opacity: 0.4 + (i % 5) * 0.1,
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
