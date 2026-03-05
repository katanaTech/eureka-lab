'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { ZoneId } from '@eureka-lab/shared-types';

const ZONE_NPC_DATA: Record<ZoneId, { name: string; emoji: string; greeting: string; color: string }> = {
  library: {
    name: 'Professor Spark',
    emoji: '🧙‍♂️',
    greeting: 'Welcome, young prompter! Ask me anything about crafting the perfect AI prompt.',
    color: '#6366f1',
  },
  forge: {
    name: 'Mechana',
    emoji: '🤖',
    greeting: 'Ready to build? Let\'s automate your world, one workflow at a time!',
    color: '#f59e0b',
  },
  citadel: {
    name: 'Byte',
    emoji: '👾',
    greeting: 'Code is power! I\'ll help you build games and apps with AI as your co-pilot.',
    color: '#10b981',
  },
  academy: {
    name: 'Agent Zero',
    emoji: '🦾',
    greeting: 'The future is agents. Design yours and watch it change the world.',
    color: '#8b5cf6',
  },
};

interface ZoneNPCProps {
  /** Which zone this NPC belongs to */
  zoneId: ZoneId;
}

/**
 * NPC guide character standing at the center of the zone.
 * Shows a speech bubble on hover with a greeting and helpful tip.
 */
export function ZoneNPC({ zoneId }: ZoneNPCProps) {
  const groupRef = useRef<Group>(null!);
  const [showSpeech, setShowSpeech] = useState(false);
  const npc = ZONE_NPC_DATA[zoneId];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.08;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.3;
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0.2, 0]}
      onPointerEnter={() => setShowSpeech(true)}
      onPointerLeave={() => setShowSpeech(false)}
    >
      {/* NPC body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshToonMaterial color={npc.color} />
      </mesh>
      {/* NPC head */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshToonMaterial color={npc.color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.85, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.1, 0.85, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>

      {/* Name tag always visible */}
      <Html position={[0, 1.6, 0]} center distanceFactor={6}>
        <div className="pointer-events-none select-none rounded-lg border border-white/10 bg-gray-900/90 px-2 py-1 text-center backdrop-blur-sm">
          <span className="text-sm">{npc.emoji}</span>
          <div className="text-xs font-bold text-white">{npc.name}</div>
        </div>
      </Html>

      {/* Speech bubble on hover */}
      {showSpeech && (
        <Html position={[1.5, 1.2, 0]} distanceFactor={6}>
          <div className="pointer-events-none max-w-48 select-none rounded-2xl border border-indigo-400/30 bg-gray-900/95 p-3 text-xs text-gray-200 backdrop-blur-sm shadow-xl">
            <p className="italic">&ldquo;{npc.greeting}&rdquo;</p>
            <div className="mt-1 text-indigo-400 text-xs">Hover a portal to start a mission!</div>
          </div>
        </Html>
      )}
    </group>
  );
}
