/**
 * Zone configuration constants — extracted from the legacy R3F ZoneIsland component
 * so they can be statically imported by pages without pulling in Three.js / R3F.
 *
 * Do NOT add any @react-three/* or three imports to this file.
 */

import type { ZoneId } from '@eureka-lab/shared-types';

/** Static metadata for a single game zone */
export interface ZoneConfig {
  /** Zone identifier used throughout the game logic */
  id: ZoneId;
  /** Display name shown in tooltips and headers */
  name: string;
  /** Learning level this zone corresponds to (1–4) */
  level: number;
  /** Emoji icon representing the zone theme */
  emoji: string;
  /** Hex colour used for glow / accent elements in 3D */
  color: string;
  /** World-space position in the 3D scene */
  position: [number, number, number];
  /** One-line description shown on hover */
  description: string;
}

/**
 * Ordered array of all four game zones.
 * Consumed by both legacy 3D components and new Phase 16 2D views.
 */
export const ZONE_CONFIGS: ZoneConfig[] = [
  {
    id: 'library',
    name: 'Library of Prompts',
    level: 1,
    emoji: '📚',
    color: '#6366f1',
    position: [-4, 0, 2],
    description: 'Master the art of prompt engineering',
  },
  {
    id: 'forge',
    name: 'Automation Forge',
    level: 2,
    emoji: '⚙️',
    color: '#f59e0b',
    position: [4, 0, 2],
    description: 'Build powerful AI-driven workflows',
  },
  {
    id: 'citadel',
    name: 'Code Citadel',
    level: 3,
    emoji: '🏰',
    color: '#10b981',
    position: [-4, 0, -3],
    description: 'Create apps and games with AI',
  },
  {
    id: 'academy',
    name: 'Agent Academy',
    level: 4,
    emoji: '🤖',
    color: '#8b5cf6',
    position: [4, 0, -3],
    description: 'Design your own AI agents',
  },
];
