'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { modulesApi, combatApi } from '@/lib/api-client';
import { useGameStore } from '@/stores/game-store';
import { useCombatStore } from '@/stores/combat-store';
import { GameHUD } from '@/components/game/GameHUD';
import { ZONE_CONFIGS } from '@/components/game/_legacy_r3f/ZoneIsland';
import type { ZoneId } from '@eureka-lab/shared-types';
import type { MissionData } from '@/components/game/_legacy_r3f/MissionDoor';

const ZoneInterior = dynamic(
  () => import('@/components/game/_legacy_r3f/ZoneInterior').then((m) => m.ZoneInterior),
  { ssr: false, loading: () => <div className="h-screen w-screen bg-gray-950" /> },
);

/** Map zone ID to learning level number */
const ZONE_LEVEL: Record<ZoneId, number> = {
  library: 1,
  forge: 2,
  citadel: 3,
  academy: 4,
};

interface ZonePageProps {
  params: { zoneId: string };
}

/**
 * Zone interior page — displays the 3D zone with mission portals.
 * Fetches real module data from the API and maps them to MissionData for the 3D scene.
 */
export default function ZonePage({ params }: ZonePageProps) {
  const zoneId = params.zoneId as ZoneId;
  const router = useRouter();
  const { startMission, exitZone, defeatedGuardianZones } = useGameStore();
  const { loadBattle, setReturnPath } = useCombatStore();
  const [guardianLoading, setGuardianLoading] = useState(false);

  const guardianDefeated = defeatedGuardianZones.includes(zoneId);

  const zone = ZONE_CONFIGS.find((z) => z.id === zoneId);
  const level = ZONE_LEVEL[zoneId] ?? 1;

  // Fetch real modules for this level from the API
  const { data: modulesData, isLoading } = useQuery({
    queryKey: ['modules', level],
    queryFn: () => modulesApi.list(level),
  });

  // Map ModuleSummary → MissionData for the 3D scene.
  // isCompleted and isLocked are both derived from mod.status, which is resolved
  // by the backend from Firestore progress records — authoritative per user.
  const missions: MissionData[] = (modulesData?.modules ?? []).map((mod) => ({
    id: `${zoneId}-${mod.id}`,
    title: mod.title,
    xpReward: mod.xpReward,
    isCompleted: mod.status === 'completed',
    isLocked: mod.status === 'locked',
    estimatedMinutes: mod.estimatedMinutes,
  }));

  function handleEnterMission(missionId: string) {
    const [, moduleId] = missionId.split(`${zoneId}-`);
    startMission(missionId);
    router.push(`/g/mission/${missionId}?moduleId=${moduleId}`);
  }

  function handleBack() {
    exitZone();
    router.push('/g/world');
  }

  const handleFightGuardian = useCallback(() => {
    setGuardianLoading(true);
    void (async () => {
      try {
        const config = await combatApi.initBattle({ battleType: 'guardian', zoneId });
        loadBattle(config);
        setReturnPath(`/g/zone/${zoneId}`);
        router.push(`/g/battle/${config.battleId}`);
      } catch {
        setGuardianLoading(false);
      }
    })();
  }, [zoneId, loadBattle, setReturnPath, router]);

  if (!zone) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-white">
        Zone not found.
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-950">
      {isLoading ? (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gray-950">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-gray-400">Entering {zone.name}…</p>
        </div>
      ) : (
        <ZoneInterior
          zoneId={zoneId}
          missions={missions}
          onEnterMission={handleEnterMission}
        />
      )}

      <GameHUD
        xp={0}
        streak={0}
        level={level}
        showBackButton
        onBack={handleBack}
      />

      {/* Zone title banner */}
      <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-center">
        <div className="rounded-2xl border border-white/10 bg-gray-900/80 px-6 py-2 backdrop-blur-sm">
          <p className="text-lg font-black text-white">
            {zone.emoji} {zone.name}
          </p>
          <p className="text-xs text-gray-400">{missions.filter((m) => m.isCompleted).length}/{missions.length} missions complete</p>
        </div>
      </div>

      {/* Guardian battle button — appears once all missions are complete */}
      {missions.length > 0 && missions.every((m) => m.isCompleted) && !guardianDefeated && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <button
            onClick={handleFightGuardian}
            disabled={guardianLoading}
            className="rounded-2xl bg-red-600 px-8 py-3 text-lg font-black text-white shadow-lg shadow-red-900/50 transition-all hover:bg-red-500 disabled:opacity-60 active:scale-95"
          >
            {guardianLoading ? 'Summoning…' : `⚔️ Fight ${zone.name} Guardian`}
          </button>
        </div>
      )}

      {/* Guardian defeated badge */}
      {guardianDefeated && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-900/20 px-6 py-2 text-center">
            <p className="text-sm font-bold text-yellow-400">✓ Guardian Defeated</p>
          </div>
        </div>
      )}
    </div>
  );
}
