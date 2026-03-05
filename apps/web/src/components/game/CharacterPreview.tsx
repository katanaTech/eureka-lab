'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import type { CareerArchetype } from '@eureka-lab/shared-types';
import { CharacterModel } from './CharacterModel';

interface CharacterPreviewProps {
  /** Career archetype to preview */
  career: CareerArchetype;
  /** Outfit color hex string */
  outfitColor: string;
  /** Skin tone index */
  skinTone: number;
  /** Whether to play the celebration animation */
  celebrating?: boolean;
}

/**
 * R3F canvas displaying the character model in the character creator.
 * Uses a dark studio environment with a contact shadow for the anime look.
 */
export function CharacterPreview({
  career,
  outfitColor,
  skinTone,
  celebrating = false,
}: CharacterPreviewProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.5], fov: 45 }}
      shadows
      className="h-full w-full"
      aria-label="Character 3D preview"
    >
      {/* Ambient + directional lights for toon shading */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 2]} intensity={1.2} castShadow />
      <directionalLight position={[-2, 2, -2]} intensity={0.3} color="#8888ff" />

      {/* Character */}
      <CharacterModel
        career={career}
        outfitColor={outfitColor}
        skinTone={skinTone}
        celebrating={celebrating}
      />

      {/* Ground shadow */}
      <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={3} blur={2} />

      {/* Background environment */}
      <color attach="background" args={['#0f0f1a']} />

      {/* Limited orbit — prevent going below the ground */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={!celebrating}
        autoRotateSpeed={1}
      />
    </Canvas>
  );
}
