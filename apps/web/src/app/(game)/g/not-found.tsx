import Link from 'next/link';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';

/**
 * Fantasy-themed 404 not-found page for the /g game route segment.
 * Rendered automatically by Next.js when no route matches within (game)/g.
 *
 * @returns A fantasy-themed 404 screen with a link back to the dashboard
 */
export default function GameNotFound() {
  return (
    <Scene className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <Logo className="mb-10" />

      {/* Void glitch number */}
      <div className="relative mb-6 select-none" aria-hidden>
        <span
          className="font-display text-[10rem] leading-none text-primary/10"
          style={{ textShadow: '0 0 60px hsl(var(--primary) / 0.4)' }}
        >
          404
        </span>
      </div>

      {/* Narrative message */}
      <h1 className="font-display text-2xl uppercase tracking-widest text-glow-primary">
        Consumed by the Void
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground leading-relaxed">
        The path you seek has been consumed by the void. No realm, no isle, no
        passage remains where you tread. Perhaps the Anti-AI Overlord erased it
        from existence.
      </p>

      {/* Decorative sigil */}
      <div className="my-8 flex items-center gap-4" aria-hidden>
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
        <span className="text-2xl">⚠</span>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
      </div>

      {/* CTA */}
      <Link href="/g/dashboard">
        <GameButton variant="primary" size="lg" aria-label="Return to the Realm Map">
          Return to the Realm Map
        </GameButton>
      </Link>

      <p className="mt-6 text-xs text-muted-foreground/40 tracking-widest uppercase">
        The journey is not over, hero.
      </p>
    </Scene>
  );
}
