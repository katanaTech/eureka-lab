'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { useCharacterStore, type Character } from '@/stores/character-store';
import { useAcademyProgressStore } from '@/stores/academy-progress-store';
import { useAuth } from '@/hooks/useAuth';
import { inventoryApi } from '@/lib/api-client';

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
  /** Lesson IDs the user has completed in this session. */
  completedLessons: string[];
  /** Video IDs the user has watched in this session. */
  watchedVideos: string[];
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
   * Mark a lesson as completed and credit KP via the backend.
   * The `kp` arg is retained for source-compatibility but ignored — the
   * server owns the amount via KP_REWARDS.
   */
  completeLesson: (lessonId: string, kp: number) => void;
  /**
   * Mark a video as watched and credit KP via the backend.
   * The `kp` arg is retained for source-compatibility but ignored — the
   * server owns the amount via KP_REWARDS.
   */
  watchVideo: (videoId: string, kp: number) => void;
  /**
   * Buy an ability if the user can afford it. Issues a backend
   * `POST /inventory/buy` then re-hydrates from `inventoryApi.getMine()`.
   * The optimistic-local mutation runs first so the UI updates immediately.
   *
   * @returns true when the user now owns the ability (already-owned counts).
   */
  buyAbility: (id: string, cost: number) => boolean;
  /**
   * Buy a weapon if the user can afford it. Issues a backend
   * `POST /inventory/buy`. Auto-equips the first weapon owned via
   * a follow-up `POST /inventory/equip`.
   *
   * @returns true when the user now owns the weapon.
   */
  buyWeapon: (id: string, cost: number) => boolean;
  /**
   * Equip a weapon (or unequip with `null`). Issues a backend
   * `POST /inventory/equip` after the optimistic-local update.
   */
  equipWeapon: (id: string | null) => void;
  /** Sign out of Firebase and clear local character + inventory + academy snapshots. */
  reset: () => Promise<void>;
}

/**
 * Aggregated hook matching ai-adventure-island's `useGame()` API surface, backed by
 * the Zustand stores + Firebase auth. Lets ported reference page code work unchanged.
 *
 * Server persistence:
 * - `character.setCharacter` calls `PUT /users/me/character`
 * - `buyAbility` / `buyWeapon` / `equipWeapon` call `POST /inventory/buy` and
 *   `/inventory/equip` after the optimistic-local mutation, then reconcile
 *   with the authoritative Inventory the server returns.
 * - `completeLesson` / `watchVideo` are optimistic-local for Plan 2 — Plan 3
 *   will add backend KP-credit endpoints.
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
  const academy = useAcademyProgressStore();
  const resetAcademy = useAcademyProgressStore((s) => s.reset);
  const { logout } = useAuth();

  const userView = authUser
    ? { username: authUser.displayName ?? authUser.email ?? 'Hero', email: authUser.email ?? '' }
    : null;

  /**
   * Fire-and-forget backend hydrate after a mutation. Swallows errors so a
   * transient network failure doesn't trigger an unhandled rejection.
   */
  const hydrateInventoryFireAndForget = () => {
    void inv.hydrate().catch(() => { /* offline tolerance */ });
  };

  return {
    // ── View ─────────────────────────────────────────────
    user: userView,
    character,
    knowledgePoints: inv.kp,
    totalKnowledgeEarned: inv.totalKpEarned,
    ownedAbilities: inv.ownedAbilityIds,
    ownedWeapons: inv.ownedWeaponIds,
    equippedWeapon: inv.equippedWeaponId,
    completedLessons: academy.completedLessonIds,
    watchedVideos: academy.watchedVideoIds,

    // ── Actions ──────────────────────────────────────────
    setCharacter: (c) => { void setCharacterStore(c); },
    addKnowledge: (amount) => inv.addKp(amount),
    spendKnowledge: (amount) => {
      if (inv.kp < amount) return false;
      inv.spendKp(amount);
      return true;
    },
    completeLesson: (lessonId, _kp) => {
      if (academy.completedLessonIds.includes(lessonId)) return;
      void academy.completeLesson(lessonId);
      // Server-authoritative KP award. Daily cap + idempotency are enforced
      // server-side; the response's `granted` is the actual amount credited
      // (may be 0 if the cap is reached for the day).
      void inventoryApi
        .creditKp({ event: 'lesson_completed', sourceId: lessonId })
        .then((res) => {
          if (res.granted > 0) inv.addKp(res.granted);
        })
        .catch(() => { /* offline tolerance */ });
    },
    watchVideo: (videoId, _kp) => {
      if (academy.watchedVideoIds.includes(videoId)) return;
      void academy.watchVideo(videoId);
      void inventoryApi
        .creditKp({ event: 'practice_completed', sourceId: videoId })
        .then((res) => {
          if (res.granted > 0) inv.addKp(res.granted);
        })
        .catch(() => { /* offline tolerance */ });
    },
    buyAbility: (id, cost) => {
      if (inv.ownedAbilityIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      // Optimistic-local first so the UI updates immediately.
      inv.spendKp(cost);
      inv.addAbility(id);
      // Authoritative server mutation + reconciling hydrate.
      void inventoryApi
        .purchaseItem({ itemId: id, itemType: 'ability' })
        .then((updated) => inv.setInventory(updated))
        .catch(() => hydrateInventoryFireAndForget());
      return true;
    },
    buyWeapon: (id, cost) => {
      if (inv.ownedWeaponIds.includes(id)) return true;
      if (inv.kp < cost) return false;
      const shouldAutoEquip = inv.equippedWeaponId === null;
      inv.spendKp(cost);
      inv.addWeapon(id);
      if (shouldAutoEquip) inv.equipWeapon(id);
      void inventoryApi
        .purchaseItem({ itemId: id, itemType: 'weapon' })
        .then((updated) => inv.setInventory(updated))
        .then(() => {
          if (shouldAutoEquip) {
            return inventoryApi
              .equipWeapon({ weaponId: id })
              .then((updated) => inv.setInventory(updated));
          }
          return undefined;
        })
        .catch(() => hydrateInventoryFireAndForget());
      return true;
    },
    equipWeapon: (id) => {
      inv.equipWeapon(id);
      void inventoryApi
        .equipWeapon({ weaponId: id })
        .then((updated) => inv.setInventory(updated))
        .catch(() => hydrateInventoryFireAndForget());
    },
    reset: async () => {
      // Reset local snapshots BEFORE Firebase signOut so a fast re-login
      // can't briefly see the previous user's KP / character / academy state.
      resetCharacter();
      resetInventory();
      resetAcademy();
      await logout();
    },
  };
}
