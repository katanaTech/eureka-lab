/**
 * Legacy R3F (React Three Fiber) components — parked as of Phase 16.
 *
 * These 3D components are preserved for potential A/B testing against the new
 * 2D cinematic fantasy UI introduced in Phase 16. They are NOT actively used
 * in the main navigation flow while the `gamifiedUi` feature flag is enabled.
 *
 * To restore 3D mode, import directly from this barrel or from individual files.
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
