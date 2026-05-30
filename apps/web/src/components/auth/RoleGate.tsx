'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole, type UserRoleString } from '@/lib/auth-redirects';

interface RoleGateProps {
  /** Roles permitted to view the children */
  allow: UserRoleString[];
  /** Protected content */
  children: ReactNode;
}

/**
 * Client-side role gate. Renders children only for users whose role is in
 * `allow`; anyone else is redirected to their own home (`homeForRole`).
 *
 * Assumes it sits inside a layout that already handles the anonymous case
 * (the `(dashboard)` layout bounces unauthenticated users to `/`). The
 * redirect runs in an effect — never during render (repo rule).
 *
 * @param allow - Allowed roles.
 * @param children - Protected content.
 */
export function RoleGate({ allow, children }: RoleGateProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role;
  const permitted = !!role && allow.includes(role);

  useEffect(() => {
    if (!isLoading && role && !permitted) {
      router.replace(homeForRole(role));
    }
  }, [isLoading, role, permitted, router]);

  if (isLoading || !permitted) return null;
  return <>{children}</>;
}
