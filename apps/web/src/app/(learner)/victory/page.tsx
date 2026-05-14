'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Crown, Sparkles, Star, Trophy } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { CLASSES } from '@/data/game';
import { useGame } from '@/state/game-context';

const worldBg = '/assets/game/world-map.jpg';

/**
 * Victory page — shown after the player clears the final-boss mission of
 * Campaign 4 (Agent Sanctum). Static page for Plan 2; certificate generation
 * (combatApi.generateCertificate) is a Plan 3 polish task.
 */
export default function VictoryPage() {
  const router = useRouter();
  const { character, totalKnowledgeEarned, ownedAbilities, ownedWeapons } = useGame();

  if (!character) return null;
  const klass = CLASSES.find((c) => c.id === character.class);
  if (!klass) return null;

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8 flex flex-col">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <Logo />
          <KpBadge />
        </header>

        <section className="max-w-3xl mx-auto mt-12 text-center animate-victory-burst panel p-8 sm:p-12 rune-ring flex-1 flex flex-col items-center justify-center">
          <Trophy className="h-20 w-20 text-accent animate-pulse-glow" />
          <p className="text-xs tracking-[0.5em] text-accent mt-4">FOUR ISLES CONQUERED</p>
          <h1 className="font-display text-4xl sm:text-6xl text-glow-gold mt-3">
            Champion of the Realm
          </h1>

          <div className="flex items-center gap-4 mt-8 panel px-5 py-3">
            <Image
              src={klass.image}
              alt={character.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover border-2"
              style={{ borderColor: `hsl(${character.color})` }}
            />
            <div className="text-left">
              <div className="font-display text-xl text-glow-primary">{character.name}</div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                <Crown className="inline h-3 w-3" /> {klass.title}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-md">
            <div className="panel p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center justify-center gap-1">
                <Star className="h-3 w-3 text-accent" /> KP
              </div>
              <div className="font-display text-2xl text-glow-primary mt-1">{totalKnowledgeEarned}</div>
            </div>
            <div className="panel p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" /> Abilities
              </div>
              <div className="font-display text-2xl text-glow-primary mt-1">{ownedAbilities.length}</div>
            </div>
            <div className="panel p-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center justify-center gap-1">
                <Crown className="h-3 w-3 text-accent" /> Weapons
              </div>
              <div className="font-display text-2xl text-glow-primary mt-1">{ownedWeapons.length}</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground max-w-lg mt-8">
            You taught the AI, sharpened your prompts, and forged tools that defeated the
            Voidmind itself. The realm is safe — for now.
          </p>

          <GameButton variant="gold" size="lg" className="mt-8" onClick={() => router.push('/dashboard')}>
            Return to the Realm Map
          </GameButton>
        </section>
      </main>
    </Scene>
  );
}
