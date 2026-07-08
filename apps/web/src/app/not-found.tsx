'use client';

import Link from 'next/link';
import { Scene } from '@/components/game/Scene';
import { Logo, GameButton } from '@eureka-lab/ui';

export default function NotFound() {
  return (
    <Scene>
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 text-center">
        <Logo className="mb-10" />
        <p className="text-xs tracking-[0.5em] text-primary/80">CONSUMED BY THE VOID</p>
        <h1 className="font-display text-6xl text-glow-primary mt-3 animate-flicker">404</h1>
        <p className="max-w-md mx-auto text-muted-foreground text-sm mt-4">
          The path you sought no longer exists. The Babble Zombies must have
          erased it from the Realm.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/">
            <GameButton variant="ghost" size="md">Return to the Awakening</GameButton>
          </Link>
          <Link href="/dashboard">
            <GameButton variant="primary" size="md">Realm Map</GameButton>
          </Link>
        </div>
      </main>
    </Scene>
  );
}
