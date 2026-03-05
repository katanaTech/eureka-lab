'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows } from '@react-three/drei';
import type { ZoneId } from '@eureka-lab/shared-types';
import { MissionDoor, type MissionData } from './MissionDoor';
import { ZoneNPC } from './ZoneNPC';
import { useGameContext } from './GameProvider';

const ZONE_COLORS: Record<ZoneId, { bg: string; floor: string; accent: string }> = {
  library:  { bg: '#050510', floor: '#0a0a1f', accent: '#6366f1' },
  forge:    { bg: '#0f0800', floor: '#1a1000', accent: '#f59e0b' },
  citadel:  { bg: '#001008', floor: '#001a0a', accent: '#10b981' },
  academy:  { bg: '#080010', floor: '#0f0020', accent: '#8b5cf6' },
};

interface ZoneInteriorProps {
  /** Which zone the player is in */
  zoneId: ZoneId;
  /** Missions available in this zone */
  missions: MissionData[];
  /** Called when the player enters a mission portal */
  onEnterMission: (missionId: string) => void;
}

/**
 * 3D zone interior — a circular arena with mission portals arranged in a ring
 * and an NPC guide in the center. Atmosphere adapts per zone.
 */
export function ZoneInterior({ zoneId, missions, onEnterMission }: ZoneInteriorProps) {
  const { quality } = useGameContext();
  const colors = ZONE_COLORS[zoneId];

  return (
    <Canvas
      camera={{ position: [0, 6, 9], fov: 50 }}
      shadows={quality === 'high'}
      className="h-full w-full"
      aria-label={`${zoneId} zone interior`}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.2}
        castShadow={quality === 'high'}
      />
      {/* Zone accent light from below */}
      <pointLight position={[0, 0, 0]} intensity={2} color={colors.accent} distance={10} />

      {/* Sky + atmosphere */}
      <color attach="background" args={[colors.bg]} />
      <Stars radius={60} depth={30} count={quality === 'low' ? 500 : 2000} factor={3} fade />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshToonMaterial color={colors.floor} />
      </mesh>
      {/* Outer ring border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <ringGeometry args={[5.8, 6.2, 32]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.3} />
      </mesh>
      <ContactShadows position={[0, -0.49, 0]} opacity={0.4} scale={12} blur={2} />

      {/* NPC guide at center */}
      <Suspense fallback={null}>
        <ZoneNPC zoneId={zoneId} />
      </Suspense>

      {/* Mission doors in a ring */}
      <Suspense fallback={null}>
        {missions.map((mission, i) => (
          <MissionDoor
            key={mission.id}
            mission={mission}
            index={i}
            onEnter={onEnterMission}
          />
        ))}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={6}
        maxDistance={14}
      />
    </Canvas>
  );
}
