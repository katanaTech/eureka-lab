'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';
import type { ZoneId } from '@eureka-lab/shared-types';

interface ZoneConfig {
  id: ZoneId;
  name: string;
  level: number;
  emoji: string;
  color: string;
  position: [number, number, number];
  description: string;
}

export const ZONE_CONFIGS: ZoneConfig[] = [
  {
    id: 'library',
    name: 'Library of Prompts',
    level: 1,
    emoji: '📚',
    color: '#6366f1',
    position: [-4, 0, 2],
    description: 'Master the art of prompt engineering',
  },
  {
    id: 'forge',
    name: 'Automation Forge',
    level: 2,
    emoji: '⚙️',
    color: '#f59e0b',
    position: [4, 0, 2],
    description: 'Build powerful AI-driven workflows',
  },
  {
    id: 'citadel',
    name: 'Code Citadel',
    level: 3,
    emoji: '🏰',
    color: '#10b981',
    position: [-4, 0, -3],
    description: 'Create apps and games with AI',
  },
  {
    id: 'academy',
    name: 'Agent Academy',
    level: 4,
    emoji: '🤖',
    color: '#8b5cf6',
    position: [4, 0, -3],
    description: 'Design your own AI agents',
  },
];

interface ZoneIslandProps {
  /** Zone configuration */
  zone: ZoneConfig;
  /** Whether this zone is accessible (completed prerequisites) */
  unlocked: boolean;
  /** Called when the player clicks this zone */
  onEnter: (id: ZoneId) => void;
  /** Completion percentage (0–1) */
  progress: number;
}

/**
 * A single clickable zone island in the world map.
 * Renders a stylized floating platform with hover glow and a tooltip overlay.
 */
export function ZoneIsland({ zone, unlocked, onEnter, progress }: ZoneIslandProps) {
  const meshRef = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // Gentle float animation
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = Math.sin(t * 0.8 + zone.level) * 0.1;
    meshRef.current.rotation.y = hovered ? t * 0.5 : 0;
  });

  const handleClick = () => {
    if (unlocked) onEnter(zone.id);
  };

  return (
    <group position={zone.position}>
      {/* Island platform */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[1.2, 1.5, 0.4, 8]} />
        <meshToonMaterial
          color={unlocked ? zone.color : '#374151'}
          opacity={unlocked ? 1 : 0.7}
          transparent={!unlocked}
        />
      </mesh>

      {/* Hover glow ring */}
      {hovered && unlocked && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.6, 32]} />
          <meshBasicMaterial color={zone.color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Progress ring on top of island */}
      {unlocked && progress > 0 && (
        <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32, 1, 0, Math.PI * 2 * progress]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
        </mesh>
      )}

      {/* Tooltip — uses drei Html to render React inside the 3D scene */}
      <Html position={[0, 1.8, 0]} center distanceFactor={8}>
        <div
          className={[
            'pointer-events-none select-none rounded-xl border px-3 py-2 text-center backdrop-blur-sm transition-all',
            hovered ? 'opacity-100' : 'opacity-80',
            unlocked
              ? 'border-white/20 bg-gray-900/90 text-white'
              : 'border-gray-600/30 bg-gray-900/70 text-gray-400',
          ].join(' ')}
          style={{ minWidth: 140 }}
        >
          <div className="text-2xl">{zone.emoji}</div>
          <div className="text-sm font-bold leading-tight">{zone.name}</div>
          <div className="text-xs text-gray-400">Level {zone.level}</div>
          {!unlocked && <div className="mt-1 text-xs text-red-400">🔒 Complete Lv{zone.level - 1} first</div>}
          {unlocked && progress > 0 && (
            <div className="mt-1 text-xs text-yellow-400">{Math.round(progress * 100)}% complete</div>
          )}
          {hovered && unlocked && (
            <div className="mt-1 text-xs text-indigo-300">{zone.description}</div>
          )}
        </div>
      </Html>
    </group>
  );
}
