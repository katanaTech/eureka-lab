'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Group } from 'three';
// TODO(phase-r3f-resume): re-point to `@/stores/game-store` when the 3D phase resumes (see _future_r3f/README.md).
import { useGameStore } from '@/stores/_future_r3f/game-store';

/**
 * Pulsating void portal rendered at the center of the world map.
 * Grows as zone guardians are defeated (scale = 0.3 + defeatedCount * 0.3).
 * Hidden when no guardians have been defeated, or after the overlord is slain.
 *
 * Must be used inside an R3F `<Canvas>` within a `<Suspense>` block.
 */
export function ZombiePortal() {
  // Selective subscriptions — avoid re-rendering on unrelated store changes
  const defeatedGuardianZones = useGameStore((s) => s.defeatedGuardianZones);
  const overlordDefeated = useGameStore((s) => s.overlordDefeated);
  const defeatedCount = defeatedGuardianZones.length;

  const ringRef  = useRef<Mesh>(null!);
  const innerRef = useRef<Mesh>(null!);
  const groupRef = useRef<Group>(null!);

  useFrame((state) => {
    // Guards: refs are null when portal is hidden (early return below)
    if (!ringRef.current || !innerRef.current || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Slow rotation for the outer ring
    ringRef.current.rotation.z = t * 0.35;
    // Inner void pulses in and out
    const pulse = 0.9 + Math.sin(t * 2.2) * 0.12;
    innerRef.current.scale.setScalar(pulse);
    // Whole portal bobs gently
    groupRef.current.position.y = -0.3 + Math.sin(t * 0.8) * 0.08;
  });

  // Portal only appears once at least one guardian is defeated and before overlord is gone
  if (defeatedCount === 0 || overlordDefeated) return null;

  const portalScale = 0.3 + defeatedCount * 0.3;

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={portalScale}>
      {/* Outer torus ring — spins slowly */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.4, 0.12, 8, 40]} />
        <meshToonMaterial color="#7928ca" emissive="#5b21b6" emissiveIntensity={1.5} />
      </mesh>

      {/* Secondary torus ring — counter-rotates for energy effect */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.15, 0.07, 6, 32]} />
        <meshToonMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={1.2} transparent opacity={0.7} />
      </mesh>

      {/* Void core — dark pulsing sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshToonMaterial color="#0a0012" emissive="#3b0764" emissiveIntensity={0.8} transparent opacity={0.92} />
      </mesh>

      {/* Energy arc particles orbiting the portal */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.4, 0, Math.sin(angle) * 1.4]}
          >
            <sphereGeometry args={[0.09, 6, 6]} />
            <meshToonMaterial
              color="#e879f9"
              emissive="#c026d3"
              emissiveIntensity={2}
            />
          </mesh>
        );
      })}

      {/* Ground glow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshBasicMaterial color="#5b21b6" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}
