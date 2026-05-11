'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import type { Group } from 'three';
import type { ZoneId } from '@eureka-lab/shared-types';

// ── Library: floating books and swirling pages ────────────────────────────────

function LibraryDecorations() {
  const pagesRef = useRef<Group>(null!);

  useFrame((state) => {
    pagesRef.current.rotation.y = state.clock.elapsedTime * 0.18;
  });

  return (
    <group>
      {/* Floating stacked books — upper left */}
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4} position={[-4.5, 1.5, -2]}>
        <group>
          {[0, 0.14, 0.28].map((yOff, i) => (
            <mesh key={i} position={[0, yOff, 0]} castShadow>
              <boxGeometry args={[0.7, 0.12, 0.5]} />
              <meshToonMaterial color={['#6366f1', '#818cf8', '#4338ca'][i]} />
            </mesh>
          ))}
        </group>
      </Float>

      {/* Floating stacked books — upper right */}
      <Float speed={0.9} rotationIntensity={0.1} floatIntensity={0.3} position={[4.2, 1.2, -2.5]}>
        <group>
          {[0, 0.14].map((yOff, i) => (
            <mesh key={i} position={[0, yOff, 0]} castShadow>
              <boxGeometry args={[0.6, 0.12, 0.45]} />
              <meshToonMaterial color={['#a5b4fc', '#c7d2fe'][i]} />
            </mesh>
          ))}
        </group>
      </Float>

      {/* Orbiting open pages */}
      <group ref={pagesRef} position={[0, 2.8, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 3.8, 0, Math.sin(angle) * 3.8]}
              rotation={[0, -angle, Math.PI / 12]}
            >
              <planeGeometry args={[0.55, 0.7]} />
              <meshToonMaterial color="#e0e7ff" transparent opacity={0.55} side={2} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ── Forge: spinning gear and spark particles ──────────────────────────────────

function ForgeDecorations() {
  const gearRef = useRef<Group>(null!);
  const sparksRef = useRef<Group>(null!);

  useFrame((state) => {
    gearRef.current.rotation.z = state.clock.elapsedTime * 0.4;
    sparksRef.current.rotation.y = state.clock.elapsedTime * 0.6;
  });

  return (
    <group>
      {/* Spinning gear — back left */}
      <group ref={gearRef} position={[-4, 2.2, -3]}>
        <mesh>
          <torusGeometry args={[0.9, 0.18, 6, 16]} />
          <meshToonMaterial color="#f59e0b" />
        </mesh>
        {/* Gear teeth */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0]}>
              <boxGeometry args={[0.22, 0.28, 0.18]} />
              <meshToonMaterial color="#fbbf24" />
            </mesh>
          );
        })}
        {/* Hub */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.18, 8]} />
          <meshToonMaterial color="#92400e" />
        </mesh>
      </group>

      {/* Floating anvil — back right */}
      <Float speed={0.7} rotationIntensity={0.08} floatIntensity={0.25} position={[4, 1.3, -2.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.4, 0.5]} />
          <meshToonMaterial color="#78716c" />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.55, 0.22, 0.4]} />
          <meshToonMaterial color="#57534e" />
        </mesh>
      </Float>

      {/* Emissive spark particles orbiting */}
      <group ref={sparksRef} position={[0, 0.6, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const r = 2.2 + (i % 2) * 0.8;
          return (
            <mesh key={i} position={[Math.cos(angle) * r, 0.4 * Math.sin(i), Math.sin(angle) * r]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshToonMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={2} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

// ── Citadel: crystal shards and circuit nodes ─────────────────────────────────

function CitadelDecorations() {
  const nodesRef = useRef<Group>(null!);

  useFrame((state) => {
    nodesRef.current.rotation.y = state.clock.elapsedTime * 0.12;
  });

  return (
    <group>
      {/* Crystal cluster — left */}
      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.3} position={[-4.2, 0.5, -1.8]}>
        <group>
          {[
            { pos: [0, 0, 0] as [number, number, number], scale: 1.0 },
            { pos: [0.4, 0.2, 0.2] as [number, number, number], scale: 0.65 },
            { pos: [-0.3, 0.15, 0.3] as [number, number, number], scale: 0.5 },
          ].map((c, i) => (
            <mesh key={i} position={c.pos} scale={c.scale} castShadow>
              <octahedronGeometry args={[0.5, 0]} />
              <meshToonMaterial
                color="#10b981"
                emissive="#10b981"
                emissiveIntensity={0.6}
              />
            </mesh>
          ))}
        </group>
      </Float>

      {/* Crystal — right */}
      <Float speed={1.1} rotationIntensity={0.07} floatIntensity={0.35} position={[4, 1, -2]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.6, 0]} />
          <meshToonMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
      </Float>

      {/* Orbiting circuit nodes */}
      <group ref={nodesRef} position={[0, 3, 0]}>
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5]}>
              <mesh>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                <meshToonMaterial color="#6ee7b7" emissive="#10b981" emissiveIntensity={0.8} />
              </mesh>
              {/* Connector line as thin box */}
              <mesh position={[(-Math.cos(angle) * 3.5) / 2, 0, (-Math.sin(angle) * 3.5) / 2]}>
                <boxGeometry args={[3.5, 0.03, 0.03]} />
                <meshToonMaterial color="#10b981" transparent opacity={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ── Academy: neural orbs and network group ────────────────────────────────────

function AcademyDecorations() {
  const networkRef = useRef<Group>(null!);

  useFrame((state) => {
    networkRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    networkRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });

  return (
    <group>
      {/* Neural orb cluster above the scene */}
      <group ref={networkRef} position={[0, 3.5, 0]}>
        {/* Central orb */}
        <mesh>
          <sphereGeometry args={[0.35, 10, 10]} />
          <meshToonMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={1} />
        </mesh>
        {/* Satellite orbs */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const r = 1.6;
          return (
            <group key={i} position={[Math.cos(angle) * r, Math.sin(angle * 0.5) * 0.4, Math.sin(angle) * r]}>
              <mesh>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshToonMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={0.7} />
              </mesh>
              {/* Synapse link */}
              <mesh position={[(-Math.cos(angle) * r) / 2, 0, (-Math.sin(angle) * r) / 2]}>
                <boxGeometry args={[r, 0.03, 0.03]} />
                <meshToonMaterial color="#7c3aed" transparent opacity={0.35} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Floating thought bubble — right */}
      <Float speed={1.0} rotationIntensity={0.12} floatIntensity={0.45} position={[4, 1.8, -2]}>
        <mesh>
          <sphereGeometry args={[0.45, 10, 10]} />
          <meshToonMaterial color="#c4b5fd" transparent opacity={0.7} />
        </mesh>
      </Float>

      {/* Floating thought bubble — left */}
      <Float speed={1.3} rotationIntensity={0.09} floatIntensity={0.3} position={[-4, 1.4, -1.5]}>
        <mesh>
          <sphereGeometry args={[0.3, 10, 10]} />
          <meshToonMaterial color="#ddd6fe" transparent opacity={0.6} />
        </mesh>
      </Float>
    </group>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

interface ZoneDecorationsProps {
  /** Which zone to render themed decorations for */
  zoneId: ZoneId;
}

/**
 * Zone-specific 3D decorative elements rendered inside the ZoneInterior Canvas.
 * Each zone has unique floating objects that reinforce its theme:
 * - Library: floating books + swirling pages
 * - Forge: spinning gear + emissive sparks
 * - Citadel: crystal shards + orbiting circuit nodes
 * - Academy: neural orb network + thought bubbles
 *
 * Must be used inside an R3F `<Canvas>` — typically within a `<Suspense>` block.
 *
 * @param zoneId - The active zone whose decorations to render
 */
export function ZoneDecorations({ zoneId }: ZoneDecorationsProps) {
  switch (zoneId) {
    case 'library':  return <LibraryDecorations />;
    case 'forge':    return <ForgeDecorations />;
    case 'citadel':  return <CitadelDecorations />;
    case 'academy':  return <AcademyDecorations />;
  }
}
