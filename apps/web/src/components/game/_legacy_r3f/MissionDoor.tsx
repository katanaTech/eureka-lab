'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';

export interface MissionData {
  id: string;
  title: string;
  xpReward: number;
  isCompleted: boolean;
  isLocked: boolean;
  estimatedMinutes: number;
}

interface MissionDoorProps {
  /** Mission data for this door */
  mission: MissionData;
  /** Index in the zone (controls position) */
  index: number;
  /** Called when the player clicks an unlocked door */
  onEnter: (missionId: string) => void;
}

/**
 * A glowing portal/door representing a single mission in the zone interior.
 * Locked missions show a padlock; completed missions glow gold.
 */
export function MissionDoor({ mission, index, onEnter }: MissionDoorProps) {
  const portalRef = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Position doors in a semicircle around the zone center
  const angle = (index / 8) * Math.PI * 2;
  const radius = 3.5;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  const portalColor = mission.isCompleted
    ? '#fbbf24'   // Gold for completed
    : mission.isLocked
    ? '#374151'   // Gray for locked
    : hovered
    ? '#818cf8'   // Bright indigo on hover
    : '#4f46e5';  // Indigo for available

  useFrame((state) => {
    if (!portalRef.current || mission.isLocked) return;
    const t = state.clock.elapsedTime;
    portalRef.current.rotation.z = Math.sin(t * 1.5 + index) * 0.05;
    const scale = hovered ? 1.08 + Math.sin(t * 4) * 0.02 : 1;
    portalRef.current.scale.setScalar(scale);
  });

  return (
    <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
      {/* Portal frame */}
      <mesh castShadow>
        <torusGeometry args={[0.7, 0.08, 8, 32]} />
        <meshToonMaterial color={portalColor} />
      </mesh>

      {/* Portal inner glow */}
      <mesh
        ref={portalRef}
        onClick={() => !mission.isLocked && onEnter(mission.id)}
        onPointerEnter={() => !mission.isLocked && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <circleGeometry args={[0.62, 32]} />
        <meshBasicMaterial
          color={portalColor}
          transparent
          opacity={mission.isLocked ? 0.15 : hovered ? 0.6 : 0.35}
        />
      </mesh>

      {/* Info tooltip */}
      <Html position={[0, 1.2, 0]} center distanceFactor={6}>
        <div
          className={[
            'pointer-events-none select-none rounded-xl border px-3 py-2 text-center backdrop-blur-sm',
            mission.isCompleted
              ? 'border-yellow-400/30 bg-gray-900/90 text-yellow-300'
              : mission.isLocked
              ? 'border-gray-600/30 bg-gray-900/70 text-gray-500'
              : 'border-indigo-400/30 bg-gray-900/90 text-white',
          ].join(' ')}
          style={{ minWidth: 130 }}
        >
          <div className="text-xs font-bold leading-tight">{mission.title}</div>
          <div className="mt-0.5 text-xs text-gray-400">
            {mission.isCompleted
              ? '✅ Completed'
              : mission.isLocked
              ? '🔒 Locked'
              : `⚡ ${mission.xpReward} XP · ${mission.estimatedMinutes}min`}
          </div>
        </div>
      </Html>
    </group>
  );
}
