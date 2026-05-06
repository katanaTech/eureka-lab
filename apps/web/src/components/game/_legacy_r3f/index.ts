/**
 * Legacy R3F (React Three Fiber) components — parked as of Phase 16.
 *
 * These 3D components are preserved for potential A/B testing against the new
 * 2D cinematic fantasy UI introduced in Phase 16. They are NOT actively used
 * in the main navigation flow while the `fantasyUi` feature flag is enabled.
 *
 * ⚠️  IMPORTANT — DYNAMIC IMPORT REQUIRED
 * All component imports from this barrel (or from individual files within this
 * directory) MUST use Next.js `dynamic()` with `{ ssr: false }`:
 *
 *   const MyComponent = dynamic(
 *     () => import('@/components/game/_legacy_r3f/MyComponent').then((m) => m.MyComponent),
 *     { ssr: false },
 *   );
 *
 * Reason: every file here imports from @react-three/fiber or @react-three/drei,
 * which require `window` / `WebGLRenderingContext` (browser-only). Static imports
 * will crash SSR and prevent tree-shaking when `fantasyUi` is true.
 *
 * Exception: `ZONE_CONFIGS` and `ZoneConfig` are re-exported here for convenience
 * but their canonical source is `@/components/game/zone-configs` (no R3F deps) —
 * prefer importing from there directly to avoid pulling in this bundle.
 */

export { BattlePlayer } from './BattlePlayer';
export { CareerAttackEffect } from './CareerAttackEffect';
export { CharacterModel } from './CharacterModel';
export { CharacterPreview } from './CharacterPreview';
export { CombatArena } from './CombatArena';
export { MissionDoor } from './MissionDoor';
export type { MissionData } from './MissionDoor';
export { MissionRoom } from './MissionRoom';
export { PlayerCharacter } from './PlayerCharacter';
export { WorldMap } from './WorldMap';
export { ZombieCharacter } from './ZombieCharacter';
export { ZombiePortal } from './ZombiePortal';
export { ZoneDecorations } from './ZoneDecorations';
export { ZoneInterior } from './ZoneInterior';
export { ZoneIsland, ZONE_CONFIGS } from './ZoneIsland';
export { ZoneNPC } from './ZoneNPC';
