'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { useCombatStore } from '@/stores/combat-store';
import { combatApi } from '@/lib/api-client';
import { GameHUD } from '@/components/game/GameHUD';
import type { ZoneId } from '@eureka-lab/shared-types';

const ALL_ZONES: ZoneId[] = ['library', 'forge', 'citadel', 'academy'];

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
  const { completedMissionIds, defeatedGuardianZones, overlordDefeated, enterZone } = useGameStore();
  const { loadBattle, setReturnPath } = useCombatStore();
  const [overlordLoading, setOverlordLoading] = useState(false);

  // Temporary static values — replace with useGamificationStore when wired up
  const xp = 0;
  const streak = 0;
  const level = 1;

  /** All 4 zone guardians must be defeated to unlock the overlord */
  const allGuardiansDefeated = ALL_ZONES.every((z) => defeatedGuardianZones.includes(z));

  function handleEnterZone(zoneId: ZoneId) {
    enterZone(zoneId);
    router.push(`/g/zone/${zoneId}`);
  }

  const handleFightOverlord = useCallback(() => {
    setOverlordLoading(true);
    void (async () => {
      try {
        const config = await combatApi.initBattle({ battleType: 'overlord' });
        loadBattle(config);
        setReturnPath('/g/world');
        router.push(`/g/battle/${config.battleId}`);
      } catch {
        setOverlordLoading(false);
      }
    })();
  }, [loadBattle, setReturnPath, router]);

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

      {/* Overlord battle trigger — unlocks when all 4 guardians are defeated */}
      {allGuardiansDefeated && !overlordDefeated && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
          <button
            onClick={handleFightOverlord}
            disabled={overlordLoading}
            className="animate-pulse rounded-2xl bg-purple-700 px-10 py-4 text-xl font-black text-white shadow-lg shadow-purple-900/60 transition-all hover:animate-none hover:bg-purple-600 disabled:opacity-60 active:scale-95"
          >
            {overlordLoading ? 'Summoning Overlord…' : '💀 Fight the Anti-AI Overlord'}
          </button>
        </div>
      )}

      {/* Overlord defeated banner */}
      {overlordDefeated && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2">
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-900/20 px-8 py-3 text-center">
            <p className="text-lg font-black text-yellow-400">🏆 AI Literacy Champion!</p>
            <p className="text-xs text-yellow-600">You defeated the Anti-AI Overlord</p>
          </div>
        </div>
      )}
    </div>
  );
}
