'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import type { ZoneId } from '@eureka-lab/shared-types';
import { useGameContext } from './GameProvider';

const ROOM_COLORS: Record<ZoneId, { bg: string; floor: string; accent: string; wallColor: string }> = {
  library:  { bg: '#030310', floor: '#0a0a20', accent: '#6366f1', wallColor: '#1e1b4b' },
  forge:    { bg: '#0a0500', floor: '#1a0f00', accent: '#f59e0b', wallColor: '#1c1008' },
  citadel:  { bg: '#000a05', floor: '#001a0a', accent: '#10b981', wallColor: '#022c22' },
  academy:  { bg: '#050010', floor: '#0e0020', accent: '#8b5cf6', wallColor: '#1e1b4b' },
};

interface MissionRoomProps {
  /** Which zone this mission belongs to (controls room aesthetics) */
  zoneId: ZoneId;
}

/**
 * 3D mission room environment.
 * Renders the atmospheric background while the LearningOverlay (HTML panel)
 * floats in front of it, anchored via drei's Html component.
 */
export function MissionRoom({ zoneId }: MissionRoomProps) {
  const { quality } = useGameContext();
  const colors = ROOM_COLORS[zoneId];

  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 55 }}
      shadows={quality === 'high'}
      className="h-full w-full"
      aria-hidden
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} castShadow={quality === 'high'} />
      <pointLight position={[0, 2, 0]} intensity={3} color={colors.accent} distance={8} />

      {/* Sky */}
      <color attach="background" args={[colors.bg]} />
      <Stars radius={40} depth={20} count={quality === 'low' ? 300 : 1000} factor={2} fade />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -1.5, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshToonMaterial color={colors.floor} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 1, -4]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshToonMaterial color={colors.wallColor} />
      </mesh>

      {/* Floating accent orb */}
      <Suspense fallback={null}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[-3.5, 1.5, -2]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshToonMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.5} />
          </mesh>
        </Float>
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
          <mesh position={[3.5, 1, -2]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshToonMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.4} />
          </mesh>
        </Float>
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}
