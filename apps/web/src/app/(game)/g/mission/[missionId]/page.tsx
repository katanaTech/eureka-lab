'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/stores/game-store';
import { useCombatStore } from '@/stores/combat-store';
import { combatApi } from '@/lib/api-client';
import { LearningOverlay } from '@/components/game/LearningOverlay';
import { MissionCompleteScreen } from '@/components/game/MissionCompleteScreen';
import { GameHUD } from '@/components/game/GameHUD';
import { ZONE_CONFIGS } from '@/components/game/_legacy_r3f/ZoneIsland';
import type { ZoneId, MissionReward } from '@eureka-lab/shared-types';

/** Map zone ID to learning level (mirrors ZonePage) */
const ZONE_LEVEL: Record<ZoneId, number> = {
  library: 1,
  forge: 2,
  citadel: 3,
  academy: 4,
};

const MissionRoom = dynamic(
  () => import('@/components/game/_legacy_r3f/MissionRoom').then((m) => m.MissionRoom),
  { ssr: false, loading: () => <div className="h-screen w-screen bg-gray-950" /> },
);

interface MissionPageProps {
  params: { missionId: string };
}

/**
 * Mission room page — 3D atmospheric background + learning content overlay.
 *
 * Layout:
 * - Full-screen MissionRoom (3D canvas, atmospheric environment)
 * - Floating LearningOverlay panel (existing ModuleDetail rendered on top)
 * - MissionCompleteScreen appears after completion
 */
export default function MissionPage({ params }: MissionPageProps) {
  const { missionId } = params;
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId') ?? missionId;
  const router = useRouter();

  const { completeMission, clearPendingReward, pendingReward, activeZoneId } = useGameStore();
  const { loadBattle, setReturnPath } = useCombatStore();
  const queryClient = useQueryClient();

  // Derive zone from the missionId prefix (format: "library-module-1")
  const zoneId: ZoneId = (activeZoneId as ZoneId) ?? 'library';
  const zone = ZONE_CONFIGS.find((z) => z.id === zoneId);
  const level = ZONE_LEVEL[zoneId] ?? 1;

  const [showComplete, setShowComplete] = useState(false);
  const [battleLoading, setBattleLoading] = useState(false);

  const handleMissionComplete = useCallback((reward: MissionReward) => {
    completeMission(missionId, reward);
    void queryClient.invalidateQueries({ queryKey: ['modules', level] });
    setBattleLoading(true);

    void (async () => {
      try {
        // Gate learning completion behind a minion battle
        const config = await combatApi.initBattle({ battleType: 'minion', zoneId });
        loadBattle(config);
        setReturnPath(`/g/zone/${zoneId}`);
        router.push(`/g/battle/${config.battleId}`);
      } catch {
        // Battle init failed — fall back to showing the reward screen directly
        setBattleLoading(false);
        setShowComplete(true);
      }
    })();
  }, [missionId, completeMission, queryClient, level, zoneId, loadBattle, setReturnPath, router]);

  const handleDismissReward = useCallback(() => {
    clearPendingReward();
    setShowComplete(false);
    router.push(`/g/zone/${zoneId}`);
  }, [clearPendingReward, router, zoneId]);

  const handleClose = useCallback(() => {
    router.push(`/g/zone/${zoneId}`);
  }, [router, zoneId]);

  // Entering battle — show full-screen loader so player isn't left on a blank page
  if (battleLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gray-950">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        <p className="font-semibold text-red-400">Zombie approaching…</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-950">
      {/* 3D atmospheric background */}
      <MissionRoom zoneId={zoneId} />

      {/* Learning content panel — floats over the 3D scene */}
      {!showComplete && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 lg:p-8">
          <div
            className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gray-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            {/* Mission room header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
              <span className="text-xl">{zone?.emoji}</span>
              <div>
                <p className="text-sm font-black text-white">
                  {zone?.name ?? 'Mission Room'}
                </p>
                <p className="text-xs text-gray-500 font-mono">{missionId}</p>
              </div>
            </div>

            {/* Learning content */}
            <div className="flex-1 overflow-hidden">
              <LearningOverlay
                moduleId={moduleId}
                onComplete={handleMissionComplete}
                onClose={handleClose}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mission complete overlay */}
      {showComplete && pendingReward && (
        <MissionCompleteScreen
          reward={pendingReward}
          onDismiss={handleDismissReward}
        />
      )}

      {/* HUD */}
      {!showComplete && (
        <GameHUD
          xp={0}
          streak={0}
          level={level}
          showBackButton
          onBack={handleClose}
        />
      )}
    </div>
  );
}
