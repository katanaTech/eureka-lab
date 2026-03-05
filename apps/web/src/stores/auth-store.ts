import { create } from 'zustand';
import type { UserProfile, SubscriptionData, PlanType } from '@eureka-lab/shared-types';

interface AuthState {
  /** Currently authenticated user, or null if logged out */
  user: UserProfile | null;
  /** True while auth state is being determined */
  isLoading: boolean;
  /** Set the user profile after login */
  setUser: (user: UserProfile | null) => void;
  /** Clear auth state on logout */
  clearUser: () => void;
  /** Get the user's current subscription data (convenience accessor) */
  getSubscription: () => SubscriptionData | null;
  /** Get the user's current plan type */
  getPlan: () => PlanType;
}

/**
 * Zustand store for client-side auth state.
 * Server data (modules, progress) lives in TanStack Query cache, not here.
 * Subscription data is part of UserProfile and refreshed via authApi.getMe().
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null, isLoading: false }),
  getSubscription: () => get().user?.subscription ?? null,
  getPlan: () => get().user?.plan ?? 'free',
}));
