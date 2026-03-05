'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { GameHUD } from '@/components/game/GameHUD';
import type { ZoneId } from '@eureka-lab/shared-types';

const WorldMap = dynamic(
  () => import('@/components/game/WorldMap').then((m) => m.WorldMap),
  { ssr: false, loading: () => <div className="h-screen w-screen bg-gray-950" /> },
);

/**
 * World map page — shows the 3D island world where the player picks a zone to enter.
 * The GameHUD overlays XP, streak, and navigation controls on top of the 3D canvas.
 */
export default function WorldPage() {
  const router = useRouter();
  const { completedMissionIds, enterZone } = useGameStore();

  // Temporary static values — replace with useGamificationStore when wired up
  const xp = 0;
  const streak = 0;
  const level = 1;

  function handleEnterZone(zoneId: ZoneId) {
    enterZone(zoneId);
    router.push(`/g/zone/${zoneId}`);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-950">
      {/* 3D canvas fills the screen */}
      <WorldMap
        completedMissionIds={completedMissionIds}
        onEnterZone={handleEnterZone}
      />

      {/* HTML overlay on top of canvas */}
      <GameHUD xp={xp} streak={streak} level={level} />

      {/* Zone name panel at bottom center */}
      <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500">Click a zone island to begin a mission</p>
      </div>
    </div>
  );
}
