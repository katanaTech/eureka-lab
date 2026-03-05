'use client';

import { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows, Environment } from '@react-three/drei';
import type { ZoneId } from '@eureka-lab/shared-types';
import { ZoneIsland, ZONE_CONFIGS } from './ZoneIsland';
import { PlayerCharacter } from './PlayerCharacter';
import { useGameContext } from './GameProvider';

interface WorldMapProps {
  /** Set of completed mission IDs used to compute zone progress */
  completedMissionIds: string[];
  /** Total missions per zone (to compute progress percentage) */
  missionsPerZone?: Record<ZoneId, number>;
  /** Called when the player selects a zone to enter */
  onEnterZone: (zoneId: ZoneId) => void;
}

const DEFAULT_MISSIONS_PER_ZONE: Record<ZoneId, number> = {
  library: 8,
  forge: 8,
  citadel: 8,
  academy: 8,
};

/**
 * Main R3F Canvas for the 3D world map.
 * Renders 4 zone islands, the player character, and atmospheric effects.
 */
export function WorldMap({
  completedMissionIds,
  missionsPerZone = DEFAULT_MISSIONS_PER_ZONE,
  onEnterZone,
}: WorldMapProps) {
  const { quality } = useGameContext();

  /** Compute zone unlock status: zone N requires zone N-1 to be ≥ 1 mission complete */
  function isZoneUnlocked(level: number): boolean {
    if (level === 1) return true;
    const prevZone = ZONE_CONFIGS.find((z) => z.level === level - 1);
    if (!prevZone) return false;
    return completedMissionIds.some((id) => id.startsWith(prevZone.id));
  }

  function getZoneProgress(zone: { id: ZoneId; level: number }): number {
    const total = missionsPerZone[zone.id] ?? 8;
    const done = completedMissionIds.filter((id) => id.startsWith(zone.id)).length;
    return Math.min(done / total, 1);
  }

  return (
    <Canvas
      camera={{ position: [0, 8, 12], fov: 50 }}
      shadows={quality === 'high'}
      className="h-full w-full"
      aria-label="3D world map"
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow={quality === 'high'}
        shadow-mapSize={quality === 'high' ? 2048 : 1024}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#4444ff" />

      {/* Sky */}
      <color attach="background" args={['#050510']} />
      <Stars radius={80} depth={40} count={quality === 'low' ? 1000 : 3000} factor={4} fade />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshToonMaterial color="#0a0a1a" />
      </mesh>
      <ContactShadows position={[0, -0.49, 0]} opacity={0.3} scale={20} blur={3} />

      {/* Zone islands */}
      <Suspense fallback={null}>
        {ZONE_CONFIGS.map((zone) => (
          <ZoneIsland
            key={zone.id}
            zone={zone}
            unlocked={isZoneUnlocked(zone.level)}
            onEnter={onEnterZone}
            progress={getZoneProgress(zone)}
          />
        ))}
      </Suspense>

      {/* Player character roaming the map */}
      <Suspense fallback={null}>
        <PlayerCharacter />
      </Suspense>

      {/* Camera controls — limited to top-down orbital view */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={8}
        maxDistance={20}
        autoRotate={false}
      />
    </Canvas>
  );
}
