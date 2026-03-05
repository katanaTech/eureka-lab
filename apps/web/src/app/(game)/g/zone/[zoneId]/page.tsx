'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/lib/api-client';
import { useGameStore } from '@/stores/game-store';
import { GameHUD } from '@/components/game/GameHUD';
import { ZONE_CONFIGS } from '@/components/game/ZoneIsland';
import type { ZoneId } from '@eureka-lab/shared-types';
import type { MissionData } from '@/components/game/MissionDoor';

const ZoneInterior = dynamic(
  () => import('@/components/game/ZoneInterior').then((m) => m.ZoneInterior),
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
  const { startMission, exitZone } = useGameStore();

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
    </div>
  );
}
