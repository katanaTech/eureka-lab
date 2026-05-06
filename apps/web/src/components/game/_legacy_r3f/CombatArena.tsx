'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type { ZombieType, CombatPhase } from '@eureka-lab/shared-types';
import { useGameContext } from '../GameProvider';
import { ZombieCharacter } from './ZombieCharacter';
import { BattlePlayer } from './BattlePlayer';
import { CareerAttackEffect } from './CareerAttackEffect';

interface CombatArenaProps {
  /** Which zombie to render on the right side of the arena */
  zombieType: ZombieType;
  /** Current combat phase — passed to character sub-components for animations */
  phase: CombatPhase;
  /** Player HP as 0–100 percentage — drives danger red glow below 30 */
  playerHpPct: number;
  /** Zombie HP as 0–100 percentage — drives zombie accent glow intensity */
  zombieHpPct: number;
}

/** Background + accent colors per zombie type (sets the battlefield mood) */
const ARENA_COLORS: Record<ZombieType, { bg: string; accent: string }> = {
  misinformation_mole: { bg: '#0a0800', accent: '#8B6914' },
  lazy_bot:            { bg: '#050a12', accent: '#607D8B' },
  bug_monster:         { bg: '#000a04', accent: '#2D6A4F' },
  memory_eraser:       { bg: '#05001c', accent: '#5E60CE' },
  overlord:            { bg: '#0a0012', accent: '#7928CA' },
};

/**
 * Full-screen R3F canvas for the combat scene.
 * Renders the player character on the left and the zombie on the right,
 * over a themed battlefield with dynamic lighting that reacts to HP levels.
 * On player_attack, fires the CareerAttackEffect projectile across the arena.
 * Must be dynamically imported with ssr:false from the battle page.
 *
 * @param zombieType - Which zombie to render
 * @param phase - Current combat phase
 * @param playerHpPct - Player HP percentage (0–100) for danger glow
 * @param zombieHpPct - Zombie HP percentage (0–100) for accent glow
 */
export function CombatArena({ zombieType, phase, playerHpPct, zombieHpPct }: CombatArenaProps) {
  const { quality } = useGameContext();
  const { bg, accent } = ARENA_COLORS[zombieType];

  const isPlayerLowHp = playerHpPct < 30;
  const isZombieLowHp = zombieHpPct < 30;
  const isAttacking = phase === 'player_attack' || phase === 'zombie_attack';

  return (
    <Canvas
      camera={{ position: [0, 1.2, 6.5], fov: 52 }}
      shadows={quality === 'high'}
      className="h-full w-full"
      aria-hidden
    >
      <color attach="background" args={[bg]} />

      {/* Base lighting */}
      <ambientLight intensity={isPlayerLowHp ? 0.12 : 0.22} />
      <directionalLight
        position={[0, 5, 3]}
        intensity={0.55}
        castShadow={quality === 'high'}
      />

      {/* Player side — cool blue glow */}
      <pointLight position={[-3.5, 2, 2]} intensity={2.5} color="#4f46e5" distance={8} />

      {/* Zombie side — themed accent glow, pulses when zombie is low HP */}
      <pointLight
        position={[4, 2, 2]}
        intensity={isZombieLowHp ? 5 : 2}
        color={accent}
        distance={10}
      />

      {/* Danger flash — red pulse when player HP is low */}
      {isPlayerLowHp && (
        <pointLight position={[0, 0, 4]} intensity={3} color="#ef4444" distance={7} />
      )}

      {/* Attack flash — brief bright center light during animation phases */}
      {isAttacking && (
        <pointLight
          position={[0, 1, 3]}
          intensity={phase === 'player_attack' ? 4 : 3}
          color={phase === 'player_attack' ? '#fde68a' : '#ef4444'}
          distance={6}
        />
      )}

      {/* Battlefield floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <meshToonMaterial color="#0d0d1a" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 1, -5]}>
        <planeGeometry args={[16, 9]} />
        <meshToonMaterial color="#07060f" />
      </mesh>

      <Stars
        radius={35}
        depth={12}
        count={quality === 'low' ? 250 : 700}
        factor={2}
        fade
        speed={isAttacking ? 4 : 0.8}
      />

      <Suspense fallback={null}>
        {/* Player — left */}
        <group position={[-2.8, 0, 0]}>
          <BattlePlayer phase={phase} />
        </group>

        {/* Career attack projectile — flies player → zombie on player_attack */}
        <CareerAttackEffect phase={phase} />

        {/* Zombie — right */}
        <group position={[2.6, 0, 0]}>
          <ZombieCharacter zombieType={zombieType} phase={phase} />
        </group>
      </Suspense>
    </Canvas>
  );
}
