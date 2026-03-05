'use client';

import { type ReactNode, useEffect } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MobileRedirect } from '@/components/shared/MobileRedirect';
import { BadgeUnlockToast } from '@/components/features/gamification/BadgeUnlockToast';
import { useGamificationStore } from '@/stores/gamification-store';
import { useAuth } from '@/hooks/useAuth';

/**
 * Dashboard layout — wraps all authenticated pages with navbar, sidebar, and route protection.
 * Initializes gamification store and shows global badge toast.
 * Includes MobileRedirect to auto-redirect PWA standalone users to mobile routes.
 * @param children - Page content
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const refreshProfile = useGamificationStore((s) => s.refreshProfile);

  /* Initialize gamification data when user is authenticated */
  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated, refreshProfile]);

  return (
    <ProtectedRoute>
      <MobileRedirect />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
        <BadgeUnlockToast />
      </div>
    </ProtectedRoute>
  );
}
