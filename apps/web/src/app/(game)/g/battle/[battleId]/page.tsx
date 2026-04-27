'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCombatStore } from '@/stores/combat-store';
import { useGameStore } from '@/stores/game-store';
import { combatApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { ZoneId } from '@eureka-lab/shared-types';
import { GameHUD } from '@/components/game/GameHUD';
import { CombatHUD } from '@/components/game/CombatHUD';
import { QuestionCard } from '@/components/game/QuestionCard';
import { DamageNumber } from '@/components/game/DamageNumber';
import {
  IntroScreen,
  VictoryScreen,
  DefeatScreen,
} from '@/components/game/CombatScreens';

/** Dynamically import the R3F arena — Three.js requires the browser environment */
const CombatArena = dynamic(
  () => import('@/components/game/_legacy_r3f/CombatArena').then((m) => m.CombatArena),
  { ssr: false, loading: () => <div className="flex-1 bg-gray-950" /> },
);

interface BattlePageProps {
  params: { battleId: string };
}

/** Maps guardian zombie type back to its zone for unlock tracking */
const ZOMBIE_TO_ZONE: Partial<Record<string, ZoneId>> = {
  misinformation_mole: 'library',
  lazy_bot:            'forge',
  bug_monster:         'citadel',
  memory_eraser:       'academy',
};

/**
 * Desktop battle page — turn-based combat arena driven by the combat store state machine.
 * Guards against stale state on refresh, redirects mobile to /m/battle/[battleId],
 * and calls completeBattle API exactly once on victory or defeat.
 *
 * @param params - Next.js dynamic route params ({ battleId })
 */
export default function BattlePage({ params }: BattlePageProps) {
  const { battleId: routeBattleId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { defeatGuardian, defeatOverlord } = useGameStore();

  const {
    battleId, battleType, zombieType, zombieName, zombieDialogue,
    playerHp, playerMaxHp, zombieHp, zombieMaxHp,
    phase, questions, currentQuestionIndex,
    lastAnswerCorrect, lastDamageDealt, lastDamageTaken, xpAwarded,
    returnPath,
    startFight, submitAnswer, advanceAfterAnimation,
    setBattleReward, setCertificateUrl, resetCombat,
  } = useCombatStore();

  const [timeRemaining, setTimeRemaining] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const correctAnswersRef = useRef(0);
  const apiCalledRef      = useRef(false);

  // Guard: stale store on refresh → go back to world
  useEffect(() => {
    if (!battleId || battleId !== routeBattleId) router.replace('/g/world');
  }, [battleId, routeBattleId, router]);

  // Mobile redirect — 3D canvas unsuitable for small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.replace(`/m/battle/${routeBattleId}`);
    }
  }, [routeBattleId, router]);

  // Track correct answers (player_attack fires only on correct answers)
  useEffect(() => {
    if (phase === 'player_attack') correctAnswersRef.current += 1;
  }, [phase]);

  // 15-second countdown — resets on each new player_turn
  useEffect(() => {
    if (phase === 'player_turn') {
      setTimeRemaining(15);
      setSelectedAnswer(null);
      timerRef.current = setInterval(() => {
        setTimeRemaining((t) => {
          if (t <= 1) { clearInterval(timerRef.current!); submitAnswer(-1, 0); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, submitAnswer]);

  // Auto-advance 1200 ms after attack animation starts
  useEffect(() => {
    if (phase === 'player_attack' || phase === 'zombie_attack') {
      const t = setTimeout(() => advanceAfterAnimation(), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, advanceAfterAnimation]);

  // Call completeBattle API exactly once when battle ends; fire unlock actions on victory
  useEffect(() => {
    if ((phase === 'victory' || phase === 'defeat') && !apiCalledRef.current && battleId) {
      apiCalledRef.current = true;
      void (async () => {
        try {
          const result = await combatApi.completeBattle(battleId, {
            outcome: phase === 'victory' ? 'victory' : 'defeat',
            correctAnswers: correctAnswersRef.current,
            totalQuestions: questions.length,
          });
          setBattleReward(result.xpAwarded, result.badgesUnlocked);

          if (phase === 'victory') {
            if (battleType === 'guardian' && zombieType) {
              const zone = ZOMBIE_TO_ZONE[zombieType];
              if (zone) defeatGuardian(zone);
            } else if (battleType === 'overlord') {
              defeatOverlord();
              const cert = await combatApi.generateCertificate(user?.displayName || 'Champion');
              setCertificateUrl(cert.certificateUrl);
              router.push('/g/victory');
            }
          }
        } catch { /* best-effort */ }
      })();
    }
  }, [phase, battleId, battleType, zombieType, questions.length, user?.displayName, setBattleReward, setCertificateUrl, defeatGuardian, defeatOverlord, router]);

  const handleAnswer = useCallback((index: number) => {
    if (phase !== 'player_turn' || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (timerRef.current) clearInterval(timerRef.current);
    submitAnswer(index, timeRemaining);
  }, [phase, selectedAnswer, submitAnswer, timeRemaining]);

  const handleExit = useCallback(
    () => { resetCombat(); router.push(returnPath ?? '/g/world'); },
    [resetCombat, router, returnPath],
  );

  // ── Phase-specific full-screen renders ─────────────────────────────────────

  if (phase === 'intro' || phase === 'idle') {
    return <IntroScreen zombieName={zombieName} zombieDialogue={zombieDialogue}
      playerMaxHp={playerMaxHp} zombieMaxHp={zombieMaxHp} onFight={startFight} onExit={handleExit} />;
  }
  if (phase === 'victory') {
    return <VictoryScreen zombieName={zombieName} xpAwarded={xpAwarded} onExit={handleExit} />;
  }
  if (phase === 'defeat') {
    return <DefeatScreen zombieName={zombieName} onExit={handleExit} />;
  }

  // ── Active combat: player_turn | player_attack | zombie_attack ─────────────

  const question    = questions[currentQuestionIndex];
  const isAttacking = phase === 'player_attack' || phase === 'zombie_attack';
  const playerHpPct = Math.round((playerHp / playerMaxHp) * 100);
  const zombieHpPct = Math.round((zombieHp / zombieMaxHp) * 100);

  return (
    <div className="relative flex h-screen w-screen flex-col bg-gray-950 text-white">
      {/* HP bars */}
      <CombatHUD
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        zombieHp={zombieHp}
        zombieMaxHp={zombieMaxHp}
        zombieName={zombieName}
      />

      {/* 3D Combat Arena */}
      <div className="relative flex-1">
        {zombieType && (
          <CombatArena
            zombieType={zombieType}
            phase={phase}
            playerHpPct={playerHpPct}
            zombieHpPct={zombieHpPct}
          />
        )}
        {/* Floating damage number — overlaid on 3D canvas; key forces remount on each hit */}
        {isAttacking && (
          <DamageNumber
            key={`${phase}-${lastDamageDealt}-${lastDamageTaken}`}
            value={phase === 'player_attack' ? lastDamageDealt : lastDamageTaken}
            type={phase === 'player_attack' ? 'dealt' : 'taken'}
          />
        )}
      </div>

      {/* Attack result text */}
      {isAttacking && (
        <div className="px-6 pb-3 text-center">
          <p className="text-sm text-gray-400">
            {lastAnswerCorrect
              ? `Correct! Knowledge strikes for ${lastDamageDealt} damage!`
              : `Wrong! ${zombieName} retaliates for ${lastDamageTaken} damage!`}
          </p>
        </div>
      )}

      {/* Question card */}
      {phase === 'player_turn' && question && (
        <QuestionCard
          question={question}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          timeRemaining={timeRemaining}
          selectedAnswer={selectedAnswer}
          onAnswer={handleAnswer}
        />
      )}

      <GameHUD xp={0} streak={0} level={1} showBackButton onBack={handleExit} />
    </div>
  );
}
