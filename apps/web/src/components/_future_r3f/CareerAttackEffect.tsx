'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { CombatPhase, CareerArchetype } from '@eureka-lab/shared-types';
// TODO(phase-r3f-resume): re-point to `@/stores/game-store` when the 3D phase resumes (see _future_r3f/README.md).
import { useGameStore } from '@/stores/_future_r3f/game-store';

interface CareerAttackEffectProps {
  /** Current combat phase — effect is visible only on 'player_attack' */
  phase: CombatPhase;
}

/**
 * Visual config per career archetype.
 * - color: emissive toon colour for the projectile meshes
 * - count: number of projectile orbs
 * - size: sphere radius
 * - spread: vertical fan spread between orbs (metres)
 * - speed: projectile travel speed (units/sec) across the arena
 */
interface AttackConfig {
  color: string;
  count: number;
  size: number;
  spread: number;
  speed: number;
}

const ATTACK_CONFIGS: Partial<Record<CareerArchetype, AttackConfig>> = {
  artist:    { color: '#f472b6', count: 5, size: 0.10, spread: 0.3, speed: 5.0 },
  engineer:  { color: '#4ade80', count: 3, size: 0.13, spread: 0.28, speed: 6.5 },
  scientist: { color: '#38bdf8', count: 4, size: 0.10, spread: 0.25, speed: 5.5 },
  gamer:     { color: '#a78bfa', count: 4, size: 0.11, spread: 0.26, speed: 7.0 },
  doctor:    { color: '#fb923c', count: 3, size: 0.12, spread: 0.30, speed: 5.0 },
};

const DEFAULT_CONFIG: AttackConfig = {
  color: '#fde68a', count: 3, size: 0.13, spread: 0.28, speed: 6.0,
};

/** X position of the player group in the arena (set in CombatArena) */
const PLAYER_X = -2.8;
/** X position of the zombie group in the arena */
const ZOMBIE_X =  2.6;
/** Height above the arena floor for the projectile trajectory */
const ORBIT_Y  =  0.5;

/**
 * R3F career-specific projectile effect.
 * Flies a fan of glowing orbs from the player toward the zombie when the combat
 * phase is 'player_attack'. Hidden during all other phases.
 *
 * Uses a ref-based progress value driven by `useFrame` so the animation never
 * triggers React re-renders. Reads career archetype via a selective Zustand
 * selector to avoid re-rendering on unrelated store changes.
 *
 * Must be placed inside a `<Canvas>` (or `<Suspense>` within one).
 *
 * @param phase - Current combat phase
 */
export function CareerAttackEffect({ phase }: CareerAttackEffectProps) {
  const careerArchetype = useGameStore((s) => s.careerArchetype);
  const groupRef   = useRef<Group>(null!);
  const progressRef = useRef(0);  // 0 → 1 across the flight
  const activeRef   = useRef(false);

  const config = (careerArchetype ? ATTACK_CONFIGS[careerArchetype] : undefined) ?? DEFAULT_CONFIG;

  // Reset progress whenever a new attack phase begins
  useEffect(() => {
    if (phase === 'player_attack') {
      progressRef.current = 0;
      activeRef.current   = true;
    } else {
      activeRef.current = false;
    }
  }, [phase]);

  useFrame((_, delta) => {
    if (!activeRef.current || !groupRef.current) return;

    progressRef.current = Math.min(1, progressRef.current + delta * config.speed * 0.35);
    // Lerp group x from player to zombie
    groupRef.current.position.x = PLAYER_X + (ZOMBIE_X - PLAYER_X) * progressRef.current;

    if (progressRef.current >= 1) {
      activeRef.current = false;
    }
  });

  if (phase !== 'player_attack') return null;

  return (
    <group ref={groupRef} position={[PLAYER_X, ORBIT_Y, 0]}>
      {Array.from({ length: config.count }).map((_, i) => {
        const yOff = (i - (config.count - 1) / 2) * config.spread;
        return (
          <mesh key={i} position={[0, yOff, 0]}>
            <sphereGeometry args={[config.size, 7, 7]} />
            <meshToonMaterial
              color={config.color}
              emissive={config.color}
              emissiveIntensity={2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
