'use client';

import { create } from 'zustand';
import { characterApi } from '@/lib/api-client';
import type { CharacterClass } from '@/data/game';

/** Character shape persisted server-side. Single source of truth for this type. */
export interface Character {
  /** Display name chosen by the player */
  name: string;
  /** Fantasy class (warrior, mage, rogue, engineer) */
  class: CharacterClass;
  /** HSL token string, e.g. "188 95% 60%" */
  color: string;
  /** Cosmetic narrative weapon name (display only) */
  weaponName: string;
}

/** Internal Zustand state + actions for the character store. */
interface CharacterState {
  /** Currently loaded character, or null if not yet hydrated/created */
  character: Character | null;
  /** True while a server request (get/put) is in flight */
  isLoading: boolean;
  /**
   * Persist the character to the backend and update local state optimistically.
   *
   * @param c - Character to save
   */
  setCharacter: (c: Character) => Promise<void>;
  /**
   * Fetch the character from the backend and populate local state.
   * Silently no-ops when the user has not yet created one (HTTP 404).
   */
  hydrate: () => Promise<void>;
  /** Clear local state — typically called on logout. */
  reset: () => void;
}

/**
 * Zustand store for the player's fantasy character.
 * NOT persisted to localStorage — the backend is the source of truth.
 * Hydrate via `hydrate()` after auth resolves.
 */
export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  isLoading: false,

  setCharacter: async (c) => {
    set({ character: c, isLoading: true });
    try {
      await characterApi.put(c);
    } finally {
      set({ isLoading: false });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const c = await characterApi.get();
      set({ character: c });
    } catch {
      /* 404 is expected when the user has not created a character yet. */
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ character: null, isLoading: false }),
}));
