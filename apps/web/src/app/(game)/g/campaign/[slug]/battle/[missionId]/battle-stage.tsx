'use client';

import { cn } from '@/lib/utils';
import { HpBar } from '@/components/game/fantasy';
import { GameButton } from '@/components/game/fantasy';
import type { FantasyClass } from '@eureka-lab/shared-types';

// ── Aura color by fantasy class ─────────────────────────────────────────────

const AURA_COLOR: Record<FantasyClass, string> = {
  mage: 'from-violet-500/30 to-violet-900/10',
  engineer: 'from-amber-500/30 to-amber-900/10',
  rogue: 'from-cyan-500/30 to-cyan-900/10',
  warrior: 'from-rose-500/30 to-rose-900/10',
};

// ── IntroOverlay ─────────────────────────────────────────────────────────────

interface IntroOverlayProps {
  /** Zombie display name */
  zombieName: string;
  /** Zombie intro dialogue */
  zombieDialogue: string;
  /** Handler for the FIGHT button */
  onStartFight: () => void;
}

/**
 * Full-screen intro overlay shown before combat begins.
 * Displays the zombie name, dialogue, and a start button.
 *
 * @param props.zombieName - The enemy display name
 * @param props.zombieDialogue - Intro dialogue text
 * @param props.onStartFight - Called when the player presses FIGHT
 * @returns Animated intro overlay
 */
export function IntroOverlay({ zombieName, zombieDialogue, onStartFight }: IntroOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-4">
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 text-center max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          A challenger appears
        </p>
        <h2 className="font-display text-4xl uppercase tracking-widest text-glow-primary mb-4">
          {zombieName}
        </h2>
        <p className="text-sm text-muted-foreground italic leading-relaxed mb-10">
          &ldquo;{zombieDialogue}&rdquo;
        </p>
        <GameButton variant="gold" size="lg" onClick={onStartFight}>
          FIGHT!
        </GameButton>
      </div>
    </div>
  );
}

// ── BattleStage ──────────────────────────────────────────────────────────────

interface BattleStageProps {
  /** Player fantasy class for aura styling */
  fantasyClass: FantasyClass;
  /** Player display name */
  playerName: string;
  /** Player current HP */
  playerHp: number;
  /** Player max HP */
  playerMaxHp: number;
  /** Zombie display name */
  zombieName: string;
  /** Zombie current HP */
  zombieHp: number;
  /** Zombie max HP */
  zombieMaxHp: number;
  /** Whether the player's last answer was correct (for animation) */
  lastAnswerCorrect: boolean | null;
  /** Damage dealt to zombie on last correct answer */
  lastDamageDealt: number;
  /** Damage taken by player on last wrong answer */
  lastDamageTaken: number;
}

/**
 * Visual battle arena — hero panel on the left, zombie on the right, HP bars below each.
 * Plays a brief attack/recoil animation based on the last answer result.
 *
 * @param props - Battle stage display props
 * @returns The hero/zombie arena with HP bars and damage numbers
 */
export function BattleStage({
  fantasyClass,
  playerName,
  playerHp,
  playerMaxHp,
  zombieName,
  zombieHp,
  zombieMaxHp,
  lastAnswerCorrect,
  lastDamageDealt,
  lastDamageTaken,
}: BattleStageProps) {
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6">
      {/* Hero panel */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            'relative flex h-32 w-28 items-center justify-center rounded-xl border bg-gradient-to-b transition-transform duration-500',
            AURA_COLOR[fantasyClass],
            lastAnswerCorrect === true && 'animate-pulse border-green-400/60',
            lastAnswerCorrect === false && 'animate-[shake_0.4s_ease-in-out] border-red-400/60',
            lastAnswerCorrect === null && 'border-primary/30'
          )}
        >
          <span className="font-display text-4xl" aria-hidden>
            {fantasyClass === 'mage' && '🧙'}
            {fantasyClass === 'warrior' && '⚔️'}
            {fantasyClass === 'rogue' && '🗡️'}
            {fantasyClass === 'engineer' && '🔮'}
          </span>
          {/* Damage taken floating number */}
          {lastDamageTaken > 0 && (
            <span
              className="absolute -top-3 right-0 animate-[damage-pop_0.8s_ease-out_forwards] font-display text-lg text-red-400"
              aria-live="polite"
            >
              -{lastDamageTaken}
            </span>
          )}
        </div>
        <HpBar
          current={playerHp}
          max={playerMaxHp}
          label={playerName}
          variant="player"
          className="w-full"
        />
      </div>

      {/* Zombie panel */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            'relative flex h-32 w-28 items-center justify-center rounded-xl border bg-gradient-to-b from-red-900/20 to-red-950/10 transition-transform duration-500',
            lastAnswerCorrect === true && 'animate-[shake_0.4s_ease-in-out] border-red-500/60',
            lastAnswerCorrect === false && 'animate-pulse border-green-400/60',
            lastAnswerCorrect === null && 'border-destructive/30'
          )}
        >
          <span className="font-display text-4xl" aria-hidden>
            🧟
          </span>
          {/* Damage dealt floating number */}
          {lastDamageDealt > 0 && (
            <span
              className="absolute -top-3 right-0 animate-[damage-pop_0.8s_ease-out_forwards] font-display text-lg text-green-400"
              aria-live="polite"
            >
              -{lastDamageDealt}
            </span>
          )}
        </div>
        <HpBar
          current={zombieHp}
          max={zombieMaxHp}
          label={zombieName}
          variant="enemy"
          className="w-full"
        />
      </div>
    </div>
  );
}
