'use client';

/**
 * Mobile battle page — route shell for /m/g/campaign/[slug]/battle/[missionId].
 * Reuses desktop battle-stage.tsx and battle-quiz.tsx (no hardcoded links).
 * Uses mobile-specific outcome panels with /m/g/ navigation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ZONE_BY_CAMPAIGN_SLUG,
  REALM_NAME_BY_ZONE,
  type ZoneId,
  type BattleType,
  type BattleConfig,
} from '@eureka-lab/shared-types';
import { Scene, Logo, KpBadge } from '@/components/game/fantasy';
import { useCombatStore } from '@/stores/combat-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useUiMode } from '@/hooks/useUiMode';
import {
  IntroOverlay,
  BattleStage,
} from '@/app/(game)/g/campaign/[slug]/battle/[missionId]/battle-stage';
import {
  BattleQuiz,
  ATTACK_ANIMATION_MS,
} from '@/app/(game)/g/campaign/[slug]/battle/[missionId]/battle-quiz';
import { MobileVictoryPanel, MobileDefeatPanel } from './mobile-battle-outcome';

/**
 * Infer battle type from mission ID naming convention.
 * @param missionId - Mission identifier
 * @returns Battle type
 */
function inferBattleType(missionId: string): BattleType {
  if (missionId.endsWith('-boss')) return 'guardian';
  if (/-(1|2|3)$/.test(missionId)) return 'minion';
  return 'minion';
}

/** POST to combat/init and return the BattleConfig. */
async function fetchInitBattle(
  bt: BattleType, zoneId: ZoneId, missionId: string,
): Promise<BattleConfig> {
  const res = await fetch('/api/v1/combat/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ battleType: bt, zoneId, missionId }),
  });
  if (!res.ok) throw new Error(`Init failed: ${res.status}`);
  return res.json() as Promise<BattleConfig>;
}

interface CompleteResult { xpAwarded: number; badgesUnlocked: string[]; kpAwarded: number }

/**
 * Mobile battle page — compact layout with mobile navigation.
 *
 * @returns The mobile battle screen
 */
export default function MobileBattlePage() {
  const params = useParams<{ slug: string; missionId: string }>();
  const router = useRouter();
  const { isGameMode } = useUiMode();

  const slug = params.slug ?? '';
  const missionId = params.missionId ?? '';
  const zoneId: ZoneId | undefined = ZONE_BY_CAMPAIGN_SLUG[slug];

  const {
    battleId, phase, zombieName, zombieDialogue,
    playerHp, playerMaxHp, zombieHp, zombieMaxHp,
    questions, currentQuestionIndex,
    lastAnswerCorrect, lastDamageDealt, lastDamageTaken,
    xpAwarded, badgesUnlocked, sparkCharges, battleType,
    loadBattle, startFight, submitAnswer, advanceAfterAnimation,
    setBattleReward, setCertificateUrl, setReturnPath,
    useSparkCharge, resetCombat,
  } = useCombatStore();

  const { addKp, setInventory } = useInventoryStore();

  const [initError, setInitError] = useState<string | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [kpAwarded, setKpAwarded] = useState(0);
  const initCalledRef = useRef(false);

  useEffect(() => { if (!zoneId) router.replace('/m/g/dashboard'); }, [zoneId, router]);

  const initBattle = useCallback(() => {
    if (!zoneId) return;
    setReturnPath(`/m/g/campaign/${slug}`);
    setIsInitialising(true);
    setInitError(null);
    fetchInitBattle(inferBattleType(missionId), zoneId, missionId)
      .then((config) => { loadBattle(config); setIsInitialising(false); })
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : 'Failed to start battle');
        setIsInitialising(false);
      });
  }, [zoneId, missionId, slug, loadBattle, setReturnPath]);

  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initBattle();
  }, [initBattle]);

  useEffect(() => {
    if (phase !== 'player_attack' && phase !== 'zombie_attack') return;
    const t = setTimeout(advanceAfterAnimation, ATTACK_ANIMATION_MS);
    return () => clearTimeout(t);
  }, [phase, advanceAfterAnimation]);

  useEffect(() => {
    if ((phase !== 'victory' && phase !== 'defeat') || !battleId) return;
    const correctAnswers = questions.filter(
      (q, i) => i < currentQuestionIndex + 1 && q.correctIndex >= 0,
    ).length;
    fetch(`/api/v1/combat/${battleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: phase, correctAnswers, totalQuestions: questions.length }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Complete failed: ${r.status}`);
        return r.json() as Promise<CompleteResult>;
      })
      .then((result) => {
        setBattleReward(result.xpAwarded, result.badgesUnlocked);
        setKpAwarded(result.kpAwarded);
        if (isGameMode && result.kpAwarded > 0) {
          addKp(result.kpAwarded);
          toast.success(`+${result.kpAwarded} KP earned!`);
        }
        fetch('/api/v1/inventory').then((r) => r.json()).then((inv) => setInventory(inv)).catch(() => null);
      })
      .catch(() => toast.error('Failed to record battle result.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, battleId]);

  const handleViewCertificate = useCallback(async () => {
    if (!battleId) return;
    try {
      const res = await fetch('/api/v1/combat/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId }),
      });
      if (!res.ok) throw new Error(`Certificate failed: ${res.status}`);
      const { certificateUrl } = await res.json() as { certificateUrl: string };
      setCertificateUrl(certificateUrl);
      router.push('/m/g/victory');
    } catch { toast.error('Failed to generate certificate.'); }
  }, [battleId, setCertificateUrl, router]);

  const handleRetry = useCallback(() => {
    resetCombat();
    initCalledRef.current = true;
    setKpAwarded(0);
    initBattle();
  }, [resetCombat, initBattle]);

  const handleSparkCharge = useCallback(() => {
    useSparkCharge();
    toast.success('Spark Charge activated! Bonus damage dealt.');
  }, [useSparkCharge]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const isOverlord = battleType === 'overlord';

  if (isInitialising) {
    return (
      <Scene className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Initialising battle" />
          <p className="mt-3 text-xs text-muted-foreground">Entering {realmName}...</p>
        </div>
      </Scene>
    );
  }

  if (initError) {
    return (
      <Scene className="flex h-screen w-screen flex-col items-center justify-center px-4">
        <p className="text-xs text-destructive mb-3">{initError}</p>
        <button onClick={() => router.push(`/m/g/campaign/${slug}`)} className="text-xs text-primary underline">
          Return to campaign
        </button>
      </Scene>
    );
  }

  return (
    <Scene className="min-h-screen px-4 pb-20 pt-4">
      {phase === 'intro' && (
        <IntroOverlay zombieName={zombieName} zombieDialogue={zombieDialogue} onStartFight={startFight} />
      )}

      <header className="flex items-center justify-between gap-3">
        <Logo withText={false} />
        <div className="flex items-center gap-2">
          <KpBadge />
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase">{realmName}</span>
        </div>
      </header>

      <div className="mt-4">
        <BattleStage
          fantasyClass="mage" playerName="Hero"
          playerHp={playerHp} playerMaxHp={playerMaxHp}
          zombieName={zombieName} zombieHp={zombieHp} zombieMaxHp={zombieMaxHp}
          lastAnswerCorrect={lastAnswerCorrect}
          lastDamageDealt={lastDamageDealt} lastDamageTaken={lastDamageTaken}
        />
      </div>

      {phase === 'player_turn' && currentQuestion && (
        <BattleQuiz
          question={currentQuestion} questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length} sparkChargesAvailable={sparkCharges}
          isGameMode={isGameMode} onAnswer={submitAnswer} onUseSparkCharge={handleSparkCharge}
        />
      )}

      {(phase === 'player_attack' || phase === 'zombie_attack') && (
        <div className="mx-auto mt-6 max-w-sm text-center">
          <p className="font-display text-base uppercase tracking-widest text-primary animate-pulse">
            {phase === 'player_attack' ? 'Your attack lands!' : 'The enemy strikes!'}
          </p>
        </div>
      )}

      {phase === 'victory' && (
        <MobileVictoryPanel xpAwarded={xpAwarded} kpAwarded={kpAwarded} badgesUnlocked={badgesUnlocked}
          isOverlord={isOverlord} slug={slug} isGameMode={isGameMode} onViewCertificate={handleViewCertificate} />
      )}

      {phase === 'defeat' && <MobileDefeatPanel slug={slug} missionId={missionId} onRetry={handleRetry} />}
    </Scene>
  );
}
