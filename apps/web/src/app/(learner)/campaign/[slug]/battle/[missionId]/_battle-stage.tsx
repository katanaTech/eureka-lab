'use client';

import Image from 'next/image';
import { Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const zombie = '/assets/game/zombie.png';

interface HpBarProps {
  name: string;
  sub: string;
  hp: number;
  max: number;
  pct: number;
  color?: string;
  tone: 'hero' | 'enemy';
  isBoss?: boolean;
}

/** Hero or enemy HP bar with name + subtitle + colored fill. */
export function HpBar({ name, sub, hp, max, pct, color, tone, isBoss }: HpBarProps) {
  return (
    <div className={cn('panel p-3 sm:p-4', tone === 'enemy' && 'text-right')}>
      <div className={cn('flex items-center gap-2', tone === 'enemy' && 'flex-row-reverse')}>
        <Heart className={cn('h-4 w-4', tone === 'hero' ? 'text-primary' : 'text-destructive')} />
        <div className={cn(tone === 'enemy' && 'text-right')}>
          <div className="font-display text-sm sm:text-base text-glow-primary leading-tight">{name}</div>
          <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{sub}</div>
        </div>
      </div>
      <div className="mt-2 h-3 rounded-full bg-background border border-border/60 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            tone === 'hero' ? 'bg-gradient-primary' : isBoss ? 'bg-gradient-to-r from-destructive to-accent' : 'bg-destructive'
          )}
          style={{
            width: `${pct}%`,
            ...(tone === 'hero' && color ? { background: `linear-gradient(90deg, hsl(${color}), hsl(var(--primary)))` } : {}),
          }}
        />
      </div>
      <div className={cn('mt-1 text-[11px] text-muted-foreground', tone === 'enemy' && 'text-right')}>
        {hp} / {max} HP
      </div>
    </div>
  );
}

interface BattleStageProps {
  heroImage: string;
  heroName: string;
  heroColor: string;
  heroAnim: string;
  heroDmg: { id: number; v: number } | null;
  enemyAnim: string;
  enemyDmg: { id: number; v: number; crit: boolean } | null;
  showSlash: boolean;
  isBoss: boolean;
  turn: 'hero' | 'enemy';
  outcome: 'win' | 'lose' | null;
}

/**
 * Battlefield: hero portrait on the left, VS marker centered, enemy portrait
 * on the right. Floating damage numbers appear on hits; slash effect appears
 * on player attack.
 */
export function BattleStage({
  heroImage, heroName, heroColor, heroAnim, heroDmg,
  enemyAnim, enemyDmg, showSlash, isBoss, turn, outcome,
}: BattleStageProps) {
  return (
    <section className="relative max-w-6xl w-full mx-auto mt-6 flex-1 flex items-end justify-between gap-6 min-h-[280px] sm:min-h-[340px]">
      {/* Hero side */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            'relative h-40 w-40 sm:h-52 sm:w-52 rounded-full overflow-hidden border-4 shadow-[0_0_40px_hsl(var(--primary)/0.5)]',
            heroAnim
          )}
          style={{ borderColor: `hsl(${heroColor})` }}
        >
          <Image src={heroImage} alt={heroName} width={208} height={208} className="w-full h-full object-cover" />
          {heroDmg && (
            <span
              key={heroDmg.id}
              className="absolute inset-x-0 -top-2 text-center font-display text-2xl text-destructive animate-damage-pop"
            >
              -{heroDmg.v}
            </span>
          )}
        </div>
        <div className="mt-3 text-[10px] tracking-[0.3em] uppercase text-primary/80">Your Hero</div>
      </div>

      {/* VS marker */}
      <div className="hidden sm:flex flex-col items-center text-center">
        <div className="font-display text-5xl text-glow-primary animate-flicker">VS</div>
        <div className={cn(
          'mt-2 text-[10px] tracking-[0.3em] uppercase',
          turn === 'hero' ? 'text-primary' : 'text-destructive'
        )}>
          {outcome ? '—' : turn === 'hero' ? 'Your Turn' : 'Enemy Turn'}
        </div>
      </div>

      {/* Enemy side */}
      <div className="relative flex flex-col items-center">
        <div className={cn('relative', enemyAnim, isBoss && 'scale-125')}>
          <Image
            src={zombie}
            alt="Zombie"
            width={208}
            height={208}
            className={cn(
              'h-40 w-40 sm:h-52 sm:w-52 object-contain drop-shadow-[0_0_25px_hsl(var(--destructive)/0.6)]',
              !enemyAnim && 'animate-float-slow'
            )}
          />
          {showSlash && (
            <Sparkles className="absolute inset-0 m-auto h-32 w-32 text-accent animate-slash" />
          )}
          {enemyDmg && (
            <span
              key={enemyDmg.id}
              className={cn(
                'absolute inset-x-0 -top-2 text-center font-display animate-damage-pop',
                enemyDmg.crit ? 'text-3xl text-accent text-glow-gold' : 'text-2xl text-primary text-glow-primary'
              )}
            >
              -{enemyDmg.v}{enemyDmg.crit && '!'}
            </span>
          )}
        </div>
        <div className="mt-3 text-[10px] tracking-[0.3em] uppercase text-destructive/80">
          {isBoss ? 'Final Boss' : 'Foe'}
        </div>
      </div>
    </section>
  );
}
