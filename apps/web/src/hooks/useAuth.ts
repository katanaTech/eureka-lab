'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook that manages Firebase auth state and syncs with the backend.
 * Listens for auth state changes, fetches the enriched profile from
 * the backend, and stores it in the Zustand auth store.
 *
 * Gracefully handles missing Firebase config (returns unauthenticated state).
 *
 * @returns Auth state and actions
 */
export function useAuth() {
  const { user, isLoading, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    /* If Firebase is not configured, mark as loaded and unauthenticated */
    if (!auth) {
      clearUser();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch {
          clearUser();
        }
      } else {
        clearUser();
      }
    });

    return () => unsubscribe();
  }, [setUser, clearUser]);

  /**
   * Sign out from both Firebase and the backend.
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort server logout */
    }
    if (auth) {
      await signOut(auth);
    }
    clearUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
