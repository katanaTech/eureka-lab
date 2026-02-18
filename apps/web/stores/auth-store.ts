import { create } from 'zustand';
import type { UserProfile } from '@eureka-lab/shared-types';

/**
 * Auth store state shape.
 */
interface AuthState {
  /** The authenticated user's profile, or null if unauthenticated */
  user: UserProfile | null;
  /** True while the initial auth state is being determined */
  isLoading: boolean;
  /** Sets the authenticated user and clears the loading state */
  setUser: (user: UserProfile | null) => void;
  /** Clears user state (called on logout) */
  clearUser: () => void;
}

/**
 * Global authentication state store.
 * Holds client-side auth status only.
 * Server data (profile details) lives in TanStack Query cache.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
}));
