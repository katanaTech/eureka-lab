'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCombatStore } from '@/stores/combat-store';
import { combatApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { MobileCombatView } from '@/components/game/MobileCombatView';

interface MobileBattlePageProps {
  params: { battleId: string };
}

/**
 * Mobile 2D CSS combat page — fullscreen overlay that covers the mobile layout chrome.
 * Owns the timer loop, API calls, and game-store side-effects.
 * Delegates all rendering to MobileCombatView.
 *
 * @param params - Next.js dynamic route params ({ battleId })
 */
export default function MobileBattlePage({ params }: MobileBattlePageProps) {
  const { battleId: routeBattleId } = params;
  const router = useRouter();
  const { user } = useAuth();

  const {
    battleId,
    battleType,
    phase,
    questions,
    submitAnswer,
    advanceAfterAnimation,
    setBattleReward,
    setCertificateUrl,
    resetCombat,
  } = useCombatStore();

  const [timeRemaining, setTimeRemaining] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const correctAnswersRef = useRef(0);
  const apiCalledRef      = useRef(false);

  // Guard: stale store on refresh → go back
  useEffect(() => {
    if (!battleId || battleId !== routeBattleId) router.replace('/m');
  }, [battleId, routeBattleId, router]);

  // Track correct answers
  useEffect(() => {
    if (phase === 'player_attack') correctAnswersRef.current += 1;
  }, [phase]);

  // 15-second countdown — resets each player_turn
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
      const timeout = setTimeout(() => advanceAfterAnimation(), 1200);
      return () => clearTimeout(timeout);
    }
  }, [phase, advanceAfterAnimation]);

  // Call completeBattle API exactly once when battle ends
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

          if (phase === 'victory' && battleType === 'overlord') {
            const cert = await combatApi.generateCertificate(user?.displayName || 'Champion');
            setCertificateUrl(cert.certificateUrl);
            router.push('/g/victory');
          }
        } catch { /* best-effort */ }
      })();
    }
  }, [phase, battleId, battleType, questions.length, user?.displayName, setBattleReward, setCertificateUrl, router]);

  const handleAnswer = useCallback((index: number) => {
    if (phase !== 'player_turn' || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (timerRef.current) clearInterval(timerRef.current);
    submitAnswer(index, timeRemaining);
  }, [phase, selectedAnswer, submitAnswer, timeRemaining]);

  const handleExit = useCallback(() => {
    resetCombat();
    router.push('/m');
  }, [resetCombat, router]);

  return (
    <MobileCombatView
      timeRemaining={timeRemaining}
      selectedAnswer={selectedAnswer}
      onAnswer={handleAnswer}
      onFight={() => { /* startFight is called inside MobileCombatView on the FIGHT button */ }}
      onExit={handleExit}
    />
  );
}
