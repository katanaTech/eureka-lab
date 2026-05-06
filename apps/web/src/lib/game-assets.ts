/**
 * Centralised asset path constants for the fantasy game UI.
 * All paths are relative to the public directory.
 *
 * @module game-assets
 */

/** Base path for all game assets */
const BASE = '/assets/game';

/** Eureka Lab brand logo (SVG) */
export const LOGO = `${BASE}/logo.svg` as const;

/** World/realm map background */
export const WORLD_MAP = `${BASE}/world-map.svg` as const;

/** Per-realm island backgrounds, indexed by campaign slug */
export const ISLAND_BY_SLUG: Record<string, string> = {
  whispers: `${BASE}/island-1.svg`,
  echoes: `${BASE}/island-2.svg`,
  glitches: `${BASE}/island-3.svg`,
  wraiths: `${BASE}/island-4.svg`,
} as const;

/** Base zombie sprite (zone-neutral) */
export const ZOMBIE_BASE = `${BASE}/zombie.svg` as const;

/** Zone-tinted zombie variants */
export const ZOMBIE_BY_ZONE: Record<string, string> = {
  whispers: `${BASE}/zombie-whispers.svg`,
  echoes: `${BASE}/zombie-echoes.svg`,
  glitches: `${BASE}/zombie-glitches.svg`,
  wraiths: `${BASE}/zombie-wraiths.svg`,
} as const;

/** Hero sprites by FantasyClass */
export const HERO_BY_CLASS: Record<string, string> = {
  warrior: `${BASE}/hero-warrior.svg`,
  mage: `${BASE}/hero-mage.svg`,
  rogue: `${BASE}/hero-rogue.svg`,
  engineer: `${BASE}/hero-engineer.svg`,
} as const;

/** Mobile-cropped backgrounds (768x1024) */
export const MOBILE = {
  worldMap: `${BASE}/mobile/world-map.svg`,
  island: (slug: string): string => `${BASE}/mobile/island-${slug}.svg`,
} as const;
