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

interface CharacterState {
  character: Character | null;
  isLoading: boolean;
  /** True after the first hydrate() resolves (success or 404). Prevents the
   *  (learner)/layout.tsx character-gate from racing with in-flight hydrate. */
  hasHydrated: boolean;
  setCharacter: (c: Character) => Promise<void>;
  hydrate: () => Promise<void>;
  reset: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  character: null,
  isLoading: false,
  hasHydrated: false,

  setCharacter: async (c) => {
    set({ character: c, isLoading: true, hasHydrated: true });
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
      set({ isLoading: false, hasHydrated: true });
    }
  },

  reset: () => set({ character: null, isLoading: false, hasHydrated: false }),
}));
