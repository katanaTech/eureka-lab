'use client';

import { Crown, Heart, Trophy } from 'lucide-react';
import { GameButton } from '@/components/game/GameButton';

interface BattleOutcomeProps {
  outcome: 'win' | 'lose';
  isBoss: boolean;
  bossName: string;
  missionXp: number;
  onMissionList: () => void;
  onContinue: () => void;
}

/**
 * Post-battle overlay. Win → trophy + XP earned + (if boss) chapter cleared
 * banner. Lose → encouragement to try again. Continue button reloads the
 * page to reset combat state without leaving the route.
 */
export function BattleOutcome({
  outcome, isBoss, bossName, missionXp, onMissionList, onContinue,
}: BattleOutcomeProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="panel max-w-md w-full p-8 text-center animate-victory-burst rune-ring">
        {outcome === 'win' ? (
          <>
            <Trophy className="h-14 w-14 mx-auto text-accent animate-pulse-glow" />
            <h2 className="font-display text-4xl text-glow-gold mt-3">Victory!</h2>
            <p className="text-muted-foreground mt-2">
              You defeated {isBoss ? bossName : 'the Babble Zombie'} and earned{' '}
              <span className="text-accent">{missionXp} XP</span>.
            </p>
            {isBoss && (
              <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                <Crown className="h-3.5 w-3.5" /> Chapter cleared!
              </p>
            )}
          </>
        ) : (
          <>
            <Heart className="h-14 w-14 mx-auto text-destructive" />
            <h2 className="font-display text-4xl text-destructive mt-3">Defeated</h2>
            <p className="text-muted-foreground mt-2">
              The zombie holds the path. Sharpen your prompts and try again.
            </p>
          </>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <GameButton variant="ghost" size="md" onClick={onMissionList}>
            Mission List
          </GameButton>
          <GameButton variant={outcome === 'win' ? 'gold' : 'primary'} size="md" onClick={onContinue}>
            {outcome === 'win' ? 'Continue' : 'Retry'}
          </GameButton>
        </div>
      </div>
    </div>
  );
}
