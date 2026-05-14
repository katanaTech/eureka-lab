'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook that manages Firebase auth state and syncs with the backend.
 * Listens for auth state changes, fetches the enriched profile from
 * the backend, and stores it in the Zustand auth store.
 *
 * Gracefully handles missing Firebase config (returns unauthenticated state).
 *
 * Mount-safety: an internal `mountedRef` skips setUser/clearUser after the
 * hook unmounts so an in-flight authApi.getMe() can't update an unmounted
 * consumer. Resolves Plan 1 review finding R4.
 *
 * @returns Auth state and actions
 */
export function useAuth() {
  const { user, isLoading, setUser, clearUser } = useAuthStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    /* If Firebase is not configured, mark as loaded and unauthenticated */
    if (!auth) {
      clearUser();
      return () => {
        mountedRef.current = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authApi.getMe();
          if (!mountedRef.current) return;
          setUser(profile);
        } catch (err) {
          if (!mountedRef.current) return;
          clearUser();
          // Orphan Firebase session (auth user exists but Firestore profile
          // doesn't): sign out so subsequent reloads don't replay the 404.
          // Network errors leave the session intact so a transient blip
          // doesn't log a legitimate user out.
          if (err instanceof ApiError && err.statusCode === 404 && auth) {
            await signOut(auth).catch(() => {});
          }
        }
      } else {
        if (!mountedRef.current) return;
        clearUser();
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
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
