'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useCharacterStore, type Character } from '@/stores/character-store';
import { useAuth } from '@/hooks/useAuth';

export type { Character };

/** Read-only view exposed by {@link useGame}. */
export interface GameStateView {
  user: { username: string; email: string } | null;
  character: Character | null;
  knowledgePoints: number;
  totalKnowledgeEarned: number;
  ownedAbilities: string[];
  ownedWeapons: string[];
  equippedWeapon: string | null;
}

/** Actions exposed by {@link useGame}. */
export interface GameStateActions {
  /** Persist the character (fire-and-forget; server write is handled by the store). */
  setCharacter: (c: Character) => void;
  /** Optimistically credit knowledge points (KP) to the local balance. */
  addKnowledge: (amount: number) => void;
  /**
   * Try to spend knowledge points.
   * @returns true when the deduction succeeded, false when the balance was insufficient.
   */
  spendKnowledge: (amount: number) => boolean;
  /**
   * Buy an ability if the user can afford it. No-op when already owned.
   * @returns true when the user now owns the ability (already owned or just bought).
   */
  buyAbility: (id: string, cost: number) => boolean;
  /**
   * Buy a weapon if the user can afford it. Auto-equips the first weapon owned.
   * @returns true when the user now owns the weapon.
   */
  buyWeapon: (id: string, cost: number) => boolean;
  /** Equip a weapon, or unequip when passed null. */
  equipWeapon: (id: string | null) => void;
  /** Sign out of Firebase and clear local character + inventory snapshots. */
  reset: () => Promise<void>;
}

/**
 * Aggregated hook matching ai-adventure-island's `useGame()` API surface, backed by
 * the Zustand stores + Firebase auth. Lets ported reference page code work unchanged.
 *
 * Server persistence is handled by the stores themselves where applicable —
 * `character.setCharacter` calls `PUT /users/me/character`; inventory mutations are
 * optimistic-local and are reconciled by `useInventoryStore.hydrate()`.
 *
 * @returns The combined view + actions object consumed by reference pages.
 */
export function useGame(): GameStateView & GameStateActions {
  const authUser = useAuthStore((s) => s.user);
  const inv = useInventoryStore();
  const character = useCharacterStore((s) => s.character);
  const setCharacterStore = useCharacterStore((s) => s.setCharacter);
  const resetCharacter = useCharacterStore((s) => s.reset);
  const resetInventory = useInventoryStore((s) => s.reset);
  const { logout } = useAuth();

  const userView = authUser
    ? { username: authUser.displayName ?? authUser.email ?? 'Hero', email: authUser.email ?? '' }
    : null;

  return {
    // ── View ─────────────────────────────────────────────
    user: userView,
    character,
    knowledgePoints: inv.kp,
    totalKnowledgeEarned: inv.totalKpEarned,
    ownedAbilities: inv.ownedAbilityIds,
    ownedWeapons: inv.ownedWeaponIds,
    equippedWeapon: inv.equippedWeaponId,

    // ── Actions ──────────────────────────────────────────
    setCharacter: (c) => { void setCharacterStore(c); },
    addKnowledge: (amount) => inv.addKp(amount),
    spendKnowledge: (amount) => {
      if (inv.kp < amount) return false;
      inv.spendKp(amount);
      return true;
    },
    buyAbility: (id, cost) => {
      if (inv.ownedAbilityIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      inv.spendKp(cost);
      inv.addAbility(id);
      return true;
    },
    buyWeapon: (id, cost) => {
      if (inv.ownedWeaponIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      inv.spendKp(cost);
      inv.addWeapon(id);
      if (inv.equippedWeaponId === null) inv.equipWeapon(id);
      return true;
    },
    equipWeapon: (id) => inv.equipWeapon(id),
    reset: async () => {
      // Reset local snapshots BEFORE Firebase signOut so a fast re-login
      // can't briefly see the previous user's KP / character.
      resetCharacter();
      resetInventory();
      await logout();
    },
  };
}
