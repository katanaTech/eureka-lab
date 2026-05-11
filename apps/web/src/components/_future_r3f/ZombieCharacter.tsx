'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { ZombieType, CombatPhase } from '@eureka-lab/shared-types';

interface ZombieCharacterProps {
  /** Which zombie archetype to render */
  zombieType: ZombieType;
  /** Current combat phase — drives attack/hurt animations */
  phase: CombatPhase;
}

/** Toon color palette per zombie type */
const ZOMBIE_COLORS: Record<ZombieType, { body: string; accent: string }> = {
  misinformation_mole: { body: '#8B6914', accent: '#5C4007' },
  lazy_bot:            { body: '#607D8B', accent: '#37474F' },
  bug_monster:         { body: '#2D6A4F', accent: '#1B4332' },
  memory_eraser:       { body: '#5E60CE', accent: '#4EA8DE' },
  overlord:            { body: '#1a0a2e', accent: '#7928CA' },
};

function MisinformationMole({ body, accent }: { body: string; accent: string }) {
  return (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[0, 1.1, 0.5]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshToonMaterial color="#d4845a" />
      </mesh>
      <mesh position={[-0.18, 1.38, 0.45]}><sphereGeometry args={[0.07, 8, 8]} /><meshToonMaterial color="#111" /></mesh>
      <mesh position={[0.18, 1.38, 0.45]}><sphereGeometry args={[0.07, 8, 8]} /><meshToonMaterial color="#111" /></mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.38, 0.5, 8, 12]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[-0.55, 0.5, 0]} rotation={[0, 0, 0.8]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.1]} />
        <meshToonMaterial color={accent} />
      </mesh>
      <mesh position={[0.55, 0.5, 0]} rotation={[0, 0, -0.8]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.1]} />
        <meshToonMaterial color={accent} />
      </mesh>
    </group>
  );
}

function LazyBot({ body, accent }: { body: string; accent: string }) {
  return (
    <group position={[0, -0.5, 0]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.7, 0.65, 0.65]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[0, 1.85, 0]}><cylinderGeometry args={[0.04, 0.04, 0.35, 8]} /><meshToonMaterial color={accent} /></mesh>
      <mesh position={[0, 2.08, 0]}><sphereGeometry args={[0.1, 8, 8]} /><meshToonMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} /></mesh>
      <mesh position={[-0.18, 1.45, 0.34]}><boxGeometry args={[0.16, 0.1, 0.05]} /><meshToonMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} /></mesh>
      <mesh position={[0.18, 1.45, 0.34]}><boxGeometry args={[0.16, 0.1, 0.05]} /><meshToonMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} /></mesh>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.7, 0.9, 0.55]} /><meshToonMaterial color={body} /></mesh>
      <mesh position={[-0.6, 0.65, 0]} castShadow><capsuleGeometry args={[0.1, 0.5, 6, 8]} /><meshToonMaterial color={accent} /></mesh>
      <mesh position={[0.6, 0.65, 0]} castShadow><capsuleGeometry args={[0.1, 0.5, 6, 8]} /><meshToonMaterial color={accent} /></mesh>
      <mesh position={[-0.22, -0.08, 0]} castShadow><capsuleGeometry args={[0.12, 0.45, 6, 8]} /><meshToonMaterial color={accent} /></mesh>
      <mesh position={[0.22, -0.08, 0]} castShadow><capsuleGeometry args={[0.12, 0.45, 6, 8]} /><meshToonMaterial color={accent} /></mesh>
    </group>
  );
}

function BugMonster({ body, accent }: { body: string; accent: string }) {
  return (
    <group position={[0, -0.3, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <icosahedronGeometry args={[0.65, 0]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshToonMaterial color={body} />
      </mesh>
      {([-0.18, 0, 0.18] as const).map((x, i) => (
        <mesh key={i} position={[x, 1.4, 0.32]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshToonMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {([-0.9, -0.4, 0.4, 0.9] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0]} rotation={[0, 0, x * 0.7]} castShadow>
          <capsuleGeometry args={[0.08, 0.55, 6, 8]} />
          <meshToonMaterial color={accent} />
        </mesh>
      ))}
    </group>
  );
}

function MemoryEraser({ body, accent }: { body: string; accent: string }) {
  return (
    <group position={[0, -0.3, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[0.55, 1.2, 12]} />
        <meshToonMaterial color={body} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[-0.15, 1.4, 0.38]}><sphereGeometry args={[0.1, 8, 8]} /><meshToonMaterial color={accent} emissive={accent} emissiveIntensity={2} /></mesh>
      <mesh position={[0.15, 1.4, 0.38]}><sphereGeometry args={[0.1, 8, 8]} /><meshToonMaterial color={accent} emissive={accent} emissiveIntensity={2} /></mesh>
      {([-0.35, 0, 0.35] as const).map((x, i) => (
        <mesh key={i} position={[x, -0.18, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshToonMaterial color={body} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Overlord({ body, accent }: { body: string; accent: string }) {
  return (
    <group position={[0, -0.8, 0]}>
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.7, 20, 20]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[-0.4, 2.82, 0]} rotation={[0, 0, -0.3]} castShadow>
        <coneGeometry args={[0.15, 0.72, 8]} />
        <meshToonMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.4, 2.82, 0]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.15, 0.72, 8]} />
        <meshToonMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-0.25, 2.2, 0.62]}><sphereGeometry args={[0.12, 10, 10]} /><meshToonMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} /></mesh>
      <mesh position={[0.25, 2.2, 0.62]}><sphereGeometry args={[0.12, 10, 10]} /><meshToonMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} /></mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.6, 1.0, 10, 16]} />
        <meshToonMaterial color={body} />
      </mesh>
      <mesh position={[-0.9, 1.3, 0]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.15, 0.8, 6, 8]} />
        <meshToonMaterial color={accent} />
      </mesh>
      <mesh position={[0.9, 1.3, 0]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.15, 0.8, 6, 8]} />
        <meshToonMaterial color={accent} />
      </mesh>
    </group>
  );
}

/**
 * 3D toon zombie character using R3F primitives + meshToonMaterial.
 * Renders one of 5 zombie archetypes; animates idle float, lunge (zombie_attack),
 * and recoil (player_attack) via useFrame.
 * Placeholder for real GLBs — swap body switch with useGLTF when assets arrive.
 *
 * @param zombieType - Which zombie silhouette to render
 * @param phase - Combat phase driving animation state
 */
export function ZombieCharacter({ zombieType, phase }: ZombieCharacterProps) {
  const groupRef = useRef<Group>(null!);
  const colors = ZOMBIE_COLORS[zombieType];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.08;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.12;

    // Lunge toward player on zombie_attack
    const targetX = phase === 'zombie_attack' ? -0.5 : phase === 'player_attack' ? 0.4 : 0;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;
  });

  const body = (() => {
    const { body: b, accent: a } = colors;
    switch (zombieType) {
      case 'misinformation_mole': return <MisinformationMole body={b} accent={a} />;
      case 'lazy_bot':            return <LazyBot body={b} accent={a} />;
      case 'bug_monster':         return <BugMonster body={b} accent={a} />;
      case 'memory_eraser':       return <MemoryEraser body={b} accent={a} />;
      case 'overlord':            return <Overlord body={b} accent={a} />;
    }
  })();

  return <group ref={groupRef}>{body}</group>;
}
