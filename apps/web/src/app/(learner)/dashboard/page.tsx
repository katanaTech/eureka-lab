'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Skull, Star, LogOut, Sparkles, Brain } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { KpBadge } from '@/components/game/KpBadge';
import { CAMPAIGNS, CLASSES } from '@/data/game';
import { useGame } from '@/state/game-context';

const worldBg = '/assets/game/world-map.jpg';
const zombie = '/assets/game/zombie.png';

/**
 * Realm Map dashboard — top HUD (KP badge + character chip + sign-out), hero strip,
 * 4 campaign cards backed by `CAMPAIGNS` in `data/game.ts`, and a Daily Skirmish panel.
 *
 * Auth + character gating is handled by `(learner)/layout.tsx`; no guards here.
 * Sign-out cascades through `useGame().reset()` (Firebase signOut + character store reset).
 */
export default function DashboardPage() {
  const { character, reset } = useGame();
  const router = useRouter();

  // The (learner) layout guards anonymous and characterless users; render nothing
  // for the brief moment before the redirect fires.
  if (!character) return null;

  const klass = CLASSES.find((c) => c.id === character.class);
  if (!klass) return null;

  const xp = 320;
  const xpMax = 1000;

  const handleSignOut = async () => {
    await reset();
    router.push('/');
  };

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen px-4 py-6 lg:px-10 lg:py-8">
        {/* Top HUD */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <Logo />
          <div className="flex items-center gap-3 flex-wrap">
            <KpBadge />
            <div className="flex items-center gap-3 panel px-4 py-2">
              <Image
                src={klass.image}
                alt={character.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover border-2"
                style={{ borderColor: `hsl(${character.color})` }}
              />
              <div className="leading-tight">
                <div className="font-display text-sm text-glow-primary">{character.name}</div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  {klass.title} · LV 3
                </div>
                <div className="mt-1 w-40 h-1.5 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary"
                    style={{ width: `${(xp / xpMax) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 h-9 w-9 rounded-lg border border-border/60 hover:border-destructive hover:text-destructive flex items-center justify-center transition-all"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero strip */}
        <section className="mt-8 mb-6 text-center animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-primary/80">REALM MAP</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            The Four Isles of AI
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto mt-2">
            Conquer one isle to unlock the next. Each chapter ends with a boss zombie that only your
            new abilities can defeat.
          </p>
        </section>

        {/* Campaign cards */}
        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {CAMPAIGNS.map((c, i) => (
            <article
              key={c.id}
              className={`panel group relative overflow-hidden flex flex-col animate-fade-in-up ${
                c.unlocked ? 'cursor-pointer hover:-translate-y-1' : 'opacity-70'
              } transition-all duration-300`}
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => c.unlocked && router.push(`/campaign/${c.slug}`)}
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={c.image}
                  alt={c.name}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-background/70 backdrop-blur border border-primary/30 text-[10px] tracking-[0.3em] uppercase">
                  Chapter {c.id}
                </div>
                {!c.unlocked && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center text-center px-4">
                    <Lock className="h-7 w-7 text-muted-foreground mb-2" />
                    <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
                      Sealed
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Defeat Chapter {c.id - 1} boss
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display text-xl text-glow-primary">{c.name}</h3>
                <p className="text-[11px] tracking-[0.3em] uppercase text-accent mt-0.5">
                  {c.subtitle}
                </p>
                <p className="text-sm text-muted-foreground mt-3 flex-1">{c.description}</p>

                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-accent" /> {c.missions.length} missions
                  </span>
                  <span className="flex items-center gap-1.5 text-destructive">
                    <Skull className="h-3.5 w-3.5" /> {c.bossName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <GameButton
                    size="sm"
                    variant={c.unlocked ? 'primary' : 'ghost'}
                    disabled={!c.unlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (c.unlocked) router.push(`/campaign/${c.slug}`);
                    }}
                  >
                    {c.unlocked ? 'Enter Isle' : 'Locked'}
                  </GameButton>
                  <GameButton
                    size="sm"
                    variant="ghost"
                    disabled={!c.unlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (c.unlocked) router.push(`/campaign/${c.slug}/prepare`);
                    }}
                  >
                    <Brain className="h-3.5 w-3.5" /> Prepare
                  </GameButton>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Daily skirmish */}
        <section className="max-w-7xl mx-auto mt-10 panel p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up">
          <Image
            src={zombie}
            alt="Zombie"
            width={300}
            height={300}
            className="h-32 w-32 object-contain animate-float-slow drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
          />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] tracking-[0.4em] uppercase text-primary/80">Daily Skirmish</p>
            <h3 className="font-display text-2xl text-glow-primary mt-1">
              A Babble Zombie Approaches!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Answer one quick AI riddle to earn 50 XP and a Spark shard.
            </p>
          </div>
          <GameButton variant="gold" size="lg">
            <Sparkles className="h-4 w-4" /> Fight Now
          </GameButton>
        </section>
      </main>
    </Scene>
  );
}
