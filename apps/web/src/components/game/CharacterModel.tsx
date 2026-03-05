'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshToonMaterial } from 'three';
import type { Mesh, Group } from 'three';
import type { CareerArchetype } from '@eureka-lab/shared-types';
import { CAREER_OPTIONS } from './CareerPicker';

interface CharacterModelProps {
  /** Career archetype — determines which GLB to load and the toon color */
  career: CareerArchetype;
  /** Outfit accent color as hex string */
  outfitColor: string;
  /** Skin tone index (0–5) */
  skinTone: number;
  /** If true, plays the 'celebrate' animation instead of 'idle' */
  celebrating?: boolean;
}

const SKIN_TONES = ['#FDDBB4', '#F5C59B', '#E8A87C', '#C68E5E', '#A0693A', '#6B3F1E'];

/**
 * 3D character model with anime toon shading.
 * Uses a placeholder capsule mesh until real GLB assets are delivered by the 3D artist.
 * When GLBs are available, replace the placeholder group with:
 *   const { scene, animations } = useGLTF(`/models/characters/character-${career}.glb`);
 *   const { actions } = useAnimations(animations, ref);
 */
export function CharacterModel({
  career,
  outfitColor,
  skinTone,
  celebrating = false,
}: CharacterModelProps) {
  const groupRef = useRef<Group>(null!);
  const bodyRef = useRef<Mesh>(null!);

  const careerOption = CAREER_OPTIONS.find((c) => c.id === career);
  const bodyColor = outfitColor || careerOption?.outfitColor || '#4f46e5';
  const skin = SKIN_TONES[skinTone] ?? SKIN_TONES[0];

  // Gentle idle float animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    groupRef.current.rotation.y = celebrating ? t * 2 : Math.sin(t * 0.5) * 0.1;
    if (celebrating && bodyRef.current) {
      bodyRef.current.scale.setScalar(1 + Math.abs(Math.sin(t * 5)) * 0.05);
    }
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
      <mesh ref={bodyRef} position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.5, 0.7, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.2, -0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.2, -0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>

      {/* Career emoji floating above head (using a sprite-like plane) */}
      <mesh position={[0, 2.1, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
