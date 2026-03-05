import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CareerArchetype,
  CharacterCustomization,
  EquipmentSlots,
  EquipmentSlotKey,
  GameItem,
  GameScene,
  MissionReward,
  ZoneId,
} from '@eureka-lab/shared-types';

/** Persisted game state shape */
export interface GameState {
  // ── Character ────────────────────────────────────────────────────────────
  /** Career archetype selected in character creator (null = not yet chosen) */
  careerArchetype: CareerArchetype | null;
  /** Visual customization chosen in character creator */
  characterCustomization: CharacterCustomization;
  /** Items currently equipped on the character */
  equippedItems: EquipmentSlots;
  /** All items the player has earned (inventory) */
  ownedItems: GameItem[];

  // ── World state ──────────────────────────────────────────────────────────
  /** Which top-level scene is active */
  currentScene: GameScene;
  /** Currently active zone (null = on world map) */
  activeZoneId: ZoneId | null;
  /** Currently active mission ID (null = not in a mission) */
  activeMissionId: string | null;
  /** Set of completed mission IDs */
  completedMissionIds: string[];

  // ── UI overlay ───────────────────────────────────────────────────────────
  /** True when the learning content panel is open over the 3D world */
  missionOverlayOpen: boolean;
  /** Pending reward to display after mission completion (null = none) */
  pendingReward: MissionReward | null;

  // ── Actions ──────────────────────────────────────────────────────────────
  /** Set the player's career archetype */
  setCareer: (career: CareerArchetype) => void;
  /** Update character visual customization (partial) */
  setCustomization: (c: Partial<CharacterCustomization>) => void;
  /** Equip an item into the given slot */
  equipItem: (slot: EquipmentSlotKey, item: GameItem) => void;
  /** Add an earned item to the owned inventory */
  addOwnedItem: (item: GameItem) => void;
  /** Navigate to a zone */
  enterZone: (zoneId: ZoneId) => void;
  /** Exit the current zone back to the world map */
  exitZone: () => void;
  /** Start a mission inside the active zone */
  startMission: (missionId: string) => void;
  /** Mark a mission complete and queue its rewards */
  completeMission: (missionId: string, rewards: MissionReward) => void;
  /** Clear the pending reward (after the reveal animation finishes) */
  clearPendingReward: () => void;
  /** Open the learning content overlay */
  openMissionOverlay: () => void;
  /** Close the learning content overlay */
  closeMissionOverlay: () => void;
  /** Reset all game state (used when starting over) */
  resetGame: () => void;
}

const DEFAULT_CUSTOMIZATION: CharacterCustomization = {
  hairStyle: 0,
  skinTone: 0,
  outfitColor: '#4f46e5',
  name: '',
};

const initialState = {
  careerArchetype: null,
  characterCustomization: DEFAULT_CUSTOMIZATION,
  equippedItems: {},
  ownedItems: [],
  currentScene: 'character_creator' as GameScene,
  activeZoneId: null,
  activeMissionId: null,
  completedMissionIds: [],
  missionOverlayOpen: false,
  pendingReward: null,
};

/**
 * Global Zustand store for Phase 15 game state.
 * Persisted to localStorage so progress survives page refreshes.
 */
export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialState,

      setCareer: (career) =>
        set({ careerArchetype: career, currentScene: 'world_map' }),

      setCustomization: (c) =>
        set((s) => ({
          characterCustomization: { ...s.characterCustomization, ...c },
        })),

      equipItem: (slot, item) =>
        set((s) => ({
          equippedItems: { ...s.equippedItems, [slot]: item },
        })),

      addOwnedItem: (item) =>
        set((s) => ({
          ownedItems: s.ownedItems.some((i) => i.id === item.id)
            ? s.ownedItems
            : [...s.ownedItems, item],
        })),

      enterZone: (zoneId) =>
        set({ activeZoneId: zoneId, currentScene: 'zone' }),

      exitZone: () =>
        set({ activeZoneId: null, currentScene: 'world_map' }),

      startMission: (missionId) =>
        set({
          activeMissionId: missionId,
          currentScene: 'mission_room',
          missionOverlayOpen: true,
        }),

      completeMission: (missionId, rewards) =>
        set((s) => ({
          completedMissionIds: s.completedMissionIds.includes(missionId)
            ? s.completedMissionIds
            : [...s.completedMissionIds, missionId],
          pendingReward: rewards,
          missionOverlayOpen: false,
        })),

      clearPendingReward: () => set({ pendingReward: null }),

      openMissionOverlay: () => set({ missionOverlayOpen: true }),

      closeMissionOverlay: () => set({ missionOverlayOpen: false }),

      resetGame: () => set(initialState),
    }),
    {
      name: 'eureka-game-state',
      // Only persist non-transient state
      partialize: (s) => ({
        careerArchetype: s.careerArchetype,
        characterCustomization: s.characterCustomization,
        equippedItems: s.equippedItems,
        ownedItems: s.ownedItems,
        completedMissionIds: s.completedMissionIds,
      }),
    },
  ),
);
