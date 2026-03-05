'use client';

import { type FC, type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  /** Content to render when authenticated */
  children: ReactNode;
  /** Required roles to access this route (optional — any authenticated user if omitted) */
  requiredRoles?: string[];
}

/**
 * Client-side route protection wrapper.
 * Redirects unauthenticated users to /login.
 * Optionally enforces role-based access.
 *
 * @param children - Protected content
 * @param requiredRoles - Roles allowed to access this route
 */
export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && user && requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        router.replace('/');
      }
    }
  }, [isLoading, user, requiredRoles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
