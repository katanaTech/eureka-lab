import { Sparkles, Shield, Swords, Zap } from 'lucide-react';

/** A single ability the hero can use during battle. */
export interface Ability {
  id: string;
  name: string;
  icon: typeof Swords;
  /** Inclusive damage range [min, max]. */
  damage: [number, number];
  /** Turns until reuse; 0 = always available. */
  cooldown: number;
  variant: 'primary' | 'gold' | 'ghost' | 'danger';
  description: string;
  /** True if the ability requires a Spark charge to fire (earned via AI Riddle). */
  special?: boolean;
}

/** A single line in the battle log. */
export interface LogEntry {
  id: number;
  text: string;
  tone: 'player' | 'enemy' | 'system' | 'crit';
}

/** Always-available core abilities every hero has. Shop-bought abilities are appended. */
export const BASE_ABILITIES: Ability[] = [
  { id: 'strike', name: 'Quick Strike', icon: Swords, damage: [10, 18], cooldown: 0, variant: 'primary', description: 'Reliable basic attack.' },
  { id: 'focus', name: 'Focus Stance', icon: Shield, damage: [4, 8], cooldown: 2, variant: 'ghost', description: 'Steady hit, recover 8 HP.' },
  { id: 'surge', name: 'Token Surge', icon: Zap, damage: [18, 28], cooldown: 3, variant: 'gold', description: 'Heavy burst attack.' },
  { id: 'spark', name: 'Spark Strike ✦', icon: Sparkles, damage: [40, 60], cooldown: 0, variant: 'danger', description: 'Special — needs a quiz charge.', special: true },
];

/** Inclusive integer in [min, max]. */
export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
