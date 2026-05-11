'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '@/stores/game-store';
import { CAREER_OPTIONS } from './CareerPicker';

/**
 * Small player character that wanders the world map center.
 * Uses a simplified version of CharacterModel (no orbit controls, smaller scale).
 * When real GLBs arrive, replace with useGLTF + useAnimations.
 */
export function PlayerCharacter() {
  const groupRef = useRef<Group>(null!);
  const { careerArchetype, characterCustomization } = useGameStore();

  const careerOption = CAREER_OPTIONS.find((c) => c.id === careerArchetype);
  const bodyColor = characterCustomization.outfitColor || careerOption?.outfitColor || '#4f46e5';

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Walk in a small circle at center of world map
    groupRef.current.position.x = Math.sin(t * 0.3) * 1.5;
    groupRef.current.position.z = Math.cos(t * 0.3) * 1.5;
    groupRef.current.position.y = Math.sin(t * 2) * 0.04 - 0.2;
    groupRef.current.rotation.y = -t * 0.3 + Math.PI / 2;
  });

  return (
    <group ref={groupRef} scale={0.4}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshToonMaterial color="#FDDBB4" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 6, 12]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -0.1, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 6, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.2, -0.1, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 6, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}
