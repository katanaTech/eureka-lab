import { create } from 'zustand';
import type { Inventory } from '@eureka-lab/shared-types';

/** Full inventory state shape */
interface InventoryState {
  // ── Inventory fields (mirrors backend Inventory type) ────────────────────
  /** Current spendable Knowledge-Points balance */
  kp: number;
  /** Lifetime KP earned (drives soft-buff comparisons in combat) */
  totalKpEarned: number;
  /** IDs of abilities the user has purchased */
  ownedAbilityIds: string[];
  /** IDs of weapons the user has purchased */
  ownedWeaponIds: string[];
  /** Currently equipped weapon ID, or null if unarmed */
  equippedWeaponId: string | null;
  /** True while inventory data is being fetched from the server */
  isLoading: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  /**
   * Replace the entire inventory state with the server-returned Inventory.
   *
   * @param inv - The Inventory document returned by the backend
   */
  setInventory: (inv: Inventory) => void;

  /**
   * Optimistically add KP to the local balance (e.g. after a battle reward).
   * The authoritative balance is always set by the next `setInventory` call.
   *
   * @param amount - Positive number of KP to add
   */
  addKp: (amount: number) => void;

  /**
   * Optimistically deduct KP from the local balance (e.g. after a shop purchase).
   * The authoritative balance is always set by the next `setInventory` call.
   * Will not go below 0.
   *
   * @param amount - Positive number of KP to spend
   */
  spendKp: (amount: number) => void;

  /**
   * Add an ability ID to the owned abilities list.
   * No-op if the ID is already present.
   *
   * @param abilityId - The ability identifier to add
   */
  addAbility: (abilityId: string) => void;

  /**
   * Add a weapon ID to the owned weapons list.
   * No-op if the ID is already present.
   *
   * @param weaponId - The weapon identifier to add
   */
  addWeapon: (weaponId: string) => void;

  /**
   * Set (or clear) the equipped weapon.
   *
   * @param weaponId - The weapon identifier to equip, or null to unequip
   */
  equipWeapon: (weaponId: string | null) => void;

  /**
   * Set the loading flag, typically while a fetch is in flight.
   *
   * @param loading - True to indicate a pending request
   */
  setLoading: (loading: boolean) => void;

  /**
   * Fetch the authoritative inventory from the backend and replace local state.
   * Called after auth resolves and after KP-affecting backend operations.
   * Silently ignores errors (e.g. offline) — local state is preserved.
   */
  hydrate: () => Promise<void>;

  /**
   * Reset all inventory state to initial defaults.
   * Called on logout or when the user switches accounts.
   */
  reset: () => void;
}

const initialState = {
  kp: 0,
  totalKpEarned: 0,
  ownedAbilityIds: [] as string[],
  ownedWeaponIds: [] as string[],
  equippedWeaponId: null as string | null,
  isLoading: false,
};

/**
 * Zustand store for the KP economy inventory state.
 * NOT persisted to localStorage — the backend is the source of truth.
 * Hydrate by calling `setInventory` after fetching from `GET /api/v1/inventory`.
 */
export const useInventoryStore = create<InventoryState>((set, get) => ({
  ...initialState,

  setInventory: (inv) =>
    set({
      kp: inv.kp,
      totalKpEarned: inv.totalKpEarned,
      ownedAbilityIds: inv.ownedAbilityIds,
      ownedWeaponIds: inv.ownedWeaponIds,
      equippedWeaponId: inv.equippedWeaponId,
      isLoading: false,
    }),

  addKp: (amount) => set({ kp: get().kp + amount }),

  spendKp: (amount) => set({ kp: Math.max(0, get().kp - amount) }),

  addAbility: (abilityId) => {
    const { ownedAbilityIds } = get();
    if (ownedAbilityIds.includes(abilityId)) return;
    set({ ownedAbilityIds: [...ownedAbilityIds, abilityId] });
  },

  addWeapon: (weaponId) => {
    const { ownedWeaponIds } = get();
    if (ownedWeaponIds.includes(weaponId)) return;
    set({ ownedWeaponIds: [...ownedWeaponIds, weaponId] });
  },

  equipWeapon: (weaponId) => set({ equippedWeaponId: weaponId }),

  setLoading: (loading) => set({ isLoading: loading }),

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const { inventoryApi } = await import('@/lib/api-client');
      const inv = await inventoryApi.getMine();
      set({
        kp: inv.kp,
        totalKpEarned: inv.totalKpEarned,
        ownedAbilityIds: inv.ownedAbilityIds,
        ownedWeaponIds: inv.ownedWeaponIds,
        equippedWeaponId: inv.equippedWeaponId,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set(initialState),
}));
