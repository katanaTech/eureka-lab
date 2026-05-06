'use client';

/**
 * Battle page — route shell for /g/campaign/[slug]/battle/[missionId].
 * Splits: battle-stage.tsx, battle-quiz.tsx, battle-outcome.tsx (rule #8).
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { IntroOverlay, BattleStage } from './battle-stage';
import { BattleQuiz, ATTACK_ANIMATION_MS } from './battle-quiz';
import { VictoryPanel, DefeatPanel } from './battle-outcome';

/**
 * Infer battle type from mission ID naming convention.
 * *-boss → guardian, *-1/2/3 → minion, fallback → minion.
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

/** Battle completion response shape. */
interface CompleteResult { xpAwarded: number; badgesUnlocked: string[]; kpAwarded: number }

export default function BattlePage() {
  const params = useParams<{ slug: string; missionId: string }>();
  const router = useRouter();
  const t = useTranslations('Phase16Battle');
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

  // Redirect if invalid slug
  useEffect(() => { if (!zoneId) router.replace('/g/dashboard'); }, [zoneId, router]);

  // Shared init routine
  const initBattle = useCallback(() => {
    if (!zoneId) return;
    setReturnPath(`/g/campaign/${slug}`);
    setIsInitialising(true);
    setInitError(null);

    fetchInitBattle(inferBattleType(missionId), zoneId, missionId)
      .then((config) => { loadBattle(config); setIsInitialising(false); })
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : 'Failed to start battle');
        setIsInitialising(false);
      });
  }, [zoneId, missionId, slug, loadBattle, setReturnPath]);

  // Init on mount
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initBattle();
  }, [initBattle]);

  // Advance after attack animation
  useEffect(() => {
    if (phase !== 'player_attack' && phase !== 'zombie_attack') return;
    const timer = setTimeout(advanceAfterAnimation, ATTACK_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [phase, advanceAfterAnimation]);

  // Complete battle on victory/defeat
  useEffect(() => {
    if ((phase !== 'victory' && phase !== 'defeat') || !battleId) return;

    const correctAnswers = questions.filter(
      (q, i) => i < currentQuestionIndex + 1 && q.correctIndex >= 0
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
          toast.success(t('kpToast', { kp: result.kpAwarded }));
        }
        fetch('/api/v1/inventory').then((r) => r.json()).then((inv) => setInventory(inv)).catch(() => null);
      })
      .catch(() => toast.error(t('recordFailed')));
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
      router.push('/g/victory');
    } catch { toast.error(t('certificateFailed')); }
  }, [battleId, setCertificateUrl, router]);

  const handleRetry = useCallback(() => {
    resetCombat();
    initCalledRef.current = true; // prevent double-call from effect
    setKpAwarded(0);
    initBattle();
  }, [resetCombat, initBattle]);

  const handleSparkCharge = useCallback(() => {
    useSparkCharge();
    toast.success(t('sparkChargeToast'));
  }, [useSparkCharge]);

  if (!zoneId) return null;

  const realmName = REALM_NAME_BY_ZONE[zoneId];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const isOverlord = battleType === 'overlord';

  if (isInitialising) {
    return (
      <Scene className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label={t('loadingAria')} />
          <p className="mt-4 text-sm text-muted-foreground">{t('enteringRealm', { realmName })}</p>
        </div>
      </Scene>
    );
  }

  if (initError) {
    return (
      <Scene className="flex h-screen w-screen flex-col items-center justify-center px-4">
        <p className="text-sm text-destructive mb-4">{initError}</p>
        <button onClick={() => router.push(`/g/campaign/${slug}`)} className="text-sm text-primary underline">
          {t('returnToCampaign')}
        </button>
      </Scene>
    );
  }

  return (
    <Scene className="min-h-screen px-4 py-6">
      {phase === 'intro' && (
        <IntroOverlay zombieName={zombieName} zombieDialogue={zombieDialogue} onStartFight={startFight} />
      )}

      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Logo withText={false} />
        <div className="flex items-center gap-3">
          <KpBadge />
          <span className="text-xs text-muted-foreground tracking-wider uppercase">{realmName}</span>
        </div>
      </header>

      <div className="mt-6">
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
        <div className="mx-auto mt-10 max-w-md text-center">
          <p className="font-display text-lg uppercase tracking-widest text-primary animate-pulse">
            {phase === 'player_attack' ? t('playerAttack') : t('enemyAttack')}
          </p>
        </div>
      )}

      {phase === 'victory' && (
        <VictoryPanel xpAwarded={xpAwarded} kpAwarded={kpAwarded} badgesUnlocked={badgesUnlocked}
          isOverlord={isOverlord} slug={slug} isGameMode={isGameMode} onViewCertificate={handleViewCertificate} />
      )}

      {phase === 'defeat' && <DefeatPanel slug={slug} missionId={missionId} onRetry={handleRetry} />}
    </Scene>
  );
}
