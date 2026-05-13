'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { CombatPhase } from '@eureka-lab/shared-types';
// TODO(phase-r3f-resume): re-point to `@/stores/game-store` when the 3D phase resumes (see _future_r3f/README.md).
import { useGameStore } from '@/stores/_future_r3f/game-store';
import { CAREER_OPTIONS } from './CareerPicker';

interface BattlePlayerProps {
  /** Current combat phase — drives attack lunge and hurt recoil */
  phase: CombatPhase;
}

const SKIN_TONES = ['#FDDBB4', '#F5C59B', '#E8A87C', '#C68E5E', '#A0693A', '#6B3F1E'];

/**
 * Player character for the combat arena.
 * Reads career and customization from the game store via selective selectors
 * to avoid full-store re-renders inside the R3F Canvas.
 * Arm rotations are driven imperatively in useFrame (not via JSX props) so
 * phase changes never trigger React re-renders or geometry recreation.
 * Replace with useGLTF + useAnimations when real GLB assets are ready.
 *
 * @param phase - Current combat phase driving animation state
 */
export function BattlePlayer({ phase }: BattlePlayerProps) {
  const groupRef   = useRef<Group>(null!);
  const leftArmRef = useRef<Mesh>(null!);
  const rightArmRef = useRef<Mesh>(null!);

  // Selective subscriptions — avoid re-rendering on unrelated store changes
  const careerArchetype         = useGameStore((s) => s.careerArchetype);
  const characterCustomization  = useGameStore((s) => s.characterCustomization);

  const careerOption = CAREER_OPTIONS.find((c) => c.id === careerArchetype);
  const bodyColor = characterCustomization.outfitColor || careerOption?.outfitColor || '#4f46e5';
  const skin = SKIN_TONES[characterCustomization.skinTone ?? 0] ?? SKIN_TONES[0];

  useFrame((state) => {
    if (!groupRef.current || !leftArmRef.current || !rightArmRef.current) return;
    const t = state.clock.elapsedTime;

    // Idle bob
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;

    // Lunge toward zombie on player_attack
    const targetX = phase === 'player_attack' ? 0.5 : phase === 'zombie_attack' ? -0.35 : 0;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.1;

    // Body shake on zombie_attack (hurt)
    if (phase === 'zombie_attack') {
      groupRef.current.rotation.z = Math.sin(t * 20) * 0.06;
    } else {
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.15;
    }

    // Arm raise on player_attack — driven imperatively, no JSX diff
    const armTarget = phase === 'player_attack' ? 1.2 : 0.3;
    leftArmRef.current.rotation.z  += ( armTarget - leftArmRef.current.rotation.z)  * 0.2;
    rightArmRef.current.rotation.z += (-armTarget - rightArmRef.current.rotation.z) * 0.2;
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshToonMaterial color={skin} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 1.55, 0.33]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.12, 1.55, 0.33]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      {/* Arms — rotation driven imperatively via useFrame to avoid JSX re-diff */}
      <mesh ref={leftArmRef} position={[-0.5, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.5, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.2, -0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}
