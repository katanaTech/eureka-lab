'use client';

import { Logo } from '@eureka-lab/ui';

/** Closing footer with brand mark and copyright line. */
export function Footer() {
  return (
    <footer className="relative py-20 px-6 border-t border-border/40">
      <div className="max-w-5xl mx-auto text-center">
        <Logo className="justify-center mb-6" tagline="CHRONICLES OF THE CODE" />
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A cinematic AI literacy adventure. Built for curious heroes ages 8 to 14.
        </p>
        <div className="mt-8 text-[10px] tracking-[0.4em] text-muted-foreground/60">
          © {new Date().getFullYear()} EUREKA LAB · CHRONICLES OF THE CODE
        </div>
      </div>
    </footer>
  );
}
