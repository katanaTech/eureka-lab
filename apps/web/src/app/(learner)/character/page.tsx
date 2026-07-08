'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Sparkles, Sword } from 'lucide-react';
import { Scene } from '@/components/game/Scene';
import { Logo, GameButton } from '@eureka-lab/ui';
import { CLASSES } from '@/data/game';
import { useGame } from '@/state/game-context';

/** Aura colour palette (HSL strings) offered to the player at character creation. */
const AURAS = [
  { name: 'Arcane', color: '188 95% 60%' },
  { name: 'Verdant', color: '145 80% 55%' },
  { name: 'Solar', color: '42 95% 60%' },
  { name: 'Void', color: '280 80% 65%' },
  { name: 'Ember', color: '12 90% 60%' },
];

/**
 * Character creation page. 4-class carousel + 5 aura colours + hero name.
 *
 * On confirm: persists to backend via the character-store (PUT /users/me/character
 * is invoked internally), toasts success, and routes to /dashboard.
 *
 * No auth guard here — `(learner)/layout.tsx` handles redirecting anonymous users.
 */
export default function CharacterCreatePage() {
  const { user, character, setCharacter } = useGame();
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [auraIdx, setAuraIdx] = useState(0);
  const [name, setName] = useState(character?.name ?? user?.username ?? '');

  const klass = CLASSES[idx];
  const aura = AURAS[auraIdx];

  const auraStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at center, hsl(${aura.color} / 0.45), transparent 65%)`,
    }),
    [aura.color],
  );

  const next = () => setIdx((i) => (i + 1) % CLASSES.length);
  const prev = () => setIdx((i) => (i - 1 + CLASSES.length) % CLASSES.length);

  const confirm = () => {
    if (!name.trim()) {
      toast.error('Your hero needs a name.');
      return;
    }
    setCharacter({
      name: name.trim(),
      class: klass.id,
      color: aura.color,
      weaponName: klass.weapon,
    });
    toast.success(`${name} the ${klass.title} is ready!`);
    router.push('/dashboard');
  };

  return (
    <Scene>
      <main className="relative min-h-screen px-4 py-6 lg:py-10">
        <header className="flex items-center justify-between mb-6 lg:mb-10">
          <Logo />
          <button
            onClick={() => router.push('/')}
            className="text-xs text-muted-foreground hover:text-primary tracking-widest uppercase"
          >
            ← Back
          </button>
        </header>

        <div className="text-center mb-6 lg:mb-10 animate-fade-in-up">
          <p className="text-xs tracking-[0.5em] text-primary/80">CHOOSE YOUR HERO</p>
          <h1 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">
            Forge Your Avatar
          </h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6 max-w-6xl mx-auto">
          {/* Carousel */}
          <div className="panel relative p-4 sm:p-8 overflow-hidden min-h-[520px] flex flex-col">
            <div className="relative flex-1 flex items-center justify-center">
              <div
                className="absolute inset-0 pointer-events-none animate-pulse-glow"
                style={auraStyle}
                aria-hidden
              />
              <button
                onClick={prev}
                className="absolute left-2 sm:left-4 z-10 h-12 w-12 rounded-full bg-background/70 border border-primary/40 flex items-center justify-center hover:bg-primary/20 hover:border-primary transition-all"
                aria-label="Previous hero"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <Image
                key={klass.id}
                src={klass.image}
                alt={klass.title}
                width={768}
                height={1024}
                priority
                className="relative z-[1] h-[420px] w-auto object-contain animate-fade-in-up drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
              />
              <button
                onClick={next}
                className="absolute right-2 sm:right-4 z-10 h-12 w-12 rounded-full bg-background/70 border border-primary/40 flex items-center justify-center hover:bg-primary/20 hover:border-primary transition-all"
                aria-label="Next hero"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div className="flex justify-center gap-2 mt-4">
              {CLASSES.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === idx ? 'w-8 bg-primary glow-primary' : 'w-2 bg-muted hover:bg-primary/40'
                  }`}
                  aria-label={`Select ${c.name}`}
                />
              ))}
            </div>
          </div>

          {/* Details panel */}
          <aside className="panel p-6 flex flex-col gap-5 animate-fade-in-up">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-primary/80 uppercase">{klass.id}</p>
              <h2 className="font-display text-3xl text-glow-primary mt-1">{klass.name}</h2>
              <p className="text-accent text-sm font-display tracking-widest uppercase">
                {klass.title}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{klass.tagline}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label="PWR" value={klass.stats.power} />
              <Stat label="INT" value={klass.stats.intellect} />
              <Stat label="SPD" value={klass.stats.speed} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-primary/80">
                <Sword className="h-3.5 w-3.5" /> Signature Weapon
              </div>
              <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3 text-sm">
                {klass.weapon}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-primary/80">
                <Sparkles className="h-3.5 w-3.5" /> Starting Abilities
              </div>
              <ul className="grid grid-cols-1 gap-1.5">
                {klass.abilities.map((a) => (
                  <li
                    key={a}
                    className="text-sm rounded-lg bg-muted/30 border border-border/40 px-3 py-2 flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary glow-primary" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-display tracking-[0.3em] uppercase text-primary/80">
                Hero Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-input border border-border/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-display tracking-[0.3em] uppercase text-primary/80">
                Aura
              </label>
              <div className="flex gap-2 flex-wrap">
                {AURAS.map((a, i) => (
                  <button
                    key={a.name}
                    onClick={() => setAuraIdx(i)}
                    className={`px-3 h-9 rounded-lg text-xs font-display tracking-widest uppercase border transition-all ${
                      i === auraIdx
                        ? 'border-primary text-foreground'
                        : 'border-border/50 text-muted-foreground hover:border-primary/60'
                    }`}
                    style={
                      i === auraIdx ? { boxShadow: `0 0 20px hsl(${a.color} / 0.6)` } : undefined
                    }
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full mr-2 align-middle"
                      style={{ background: `hsl(${a.color})` }}
                    />
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            <GameButton onClick={confirm} size="lg" className="w-full mt-2">
              Confirm Hero
            </GameButton>
          </aside>
        </div>
      </main>
    </Scene>
  );
}

/**
 * Single stat tile for the character details panel.
 * @param props.label - Short label (e.g. "PWR")
 * @param props.value - Stat value 0-10
 */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-3 text-center">
      <div className="text-[10px] tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl text-glow-primary">{value}</div>
      <div className="mt-1 h-1 rounded-full bg-background overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}
