/**
 * Zustand store for gamification state.
 * Manages XP, level, streak, badges, and new badge notifications.
 *
 * @module gamification-store
 */

import { create } from 'zustand';
import type {
  Badge,
  XpLevel,
  StreakInfo,
  DayActivity,
} from '@eureka-lab/shared-types';
import { gamificationApi } from '../lib/api-client';

/** Gamification store state */
interface GamificationState {
  /** Total XP earned */
  xp: number;
  /** Current XP level tier */
  level: XpLevel | null;
  /** Streak information */
  streak: StreakInfo | null;
  /** All earned badges */
  badges: Badge[];
  /** Recent daily activity for heatmap */
  recentActivity: DayActivity[];
  /** Newly earned badge (for toast notification) */
  newBadge: Badge | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Set a newly earned badge for toast display */
  setNewBadge: (badge: Badge) => void;
  /** Clear the new badge notification */
  clearNewBadge: () => void;
  /** Fetch full gamification profile from backend */
  refreshProfile: () => Promise<void>;
  /** Reset the store (on logout) */
  reset: () => void;
}

/** Initial state values */
const initialState = {
  xp: 0,
  level: null,
  streak: null,
  badges: [],
  recentActivity: [],
  newBadge: null,
  isLoading: false,
};

/**
 * Gamification store — tracks XP, badges, streaks, and activity.
 * Call refreshProfile() after auth to initialize.
 */
export const useGamificationStore = create<GamificationState>((set) => ({
  ...initialState,

  setNewBadge: (badge: Badge) => set({ newBadge: badge }),

  clearNewBadge: () => set({ newBadge: null }),

  refreshProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await gamificationApi.getProfile();
      set({
        xp: profile.xp,
        level: profile.level,
        streak: profile.streak,
        badges: profile.badges,
        recentActivity: profile.recentActivity,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set(initialState),
}));
