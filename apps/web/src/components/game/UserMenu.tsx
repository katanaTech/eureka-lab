'use client';

import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/** Lucide icon per role. Falls back to `ShieldCheck` for unknown roles. */
function RoleIcon({ role }: { role: string }) {
  if (role === 'teacher') return <Briefcase className="h-3.5 w-3.5" aria-hidden />;
  return <ShieldCheck className="h-3.5 w-3.5" aria-hidden />;
}

/**
 * Fantasy-styled user chip + sign-out for non-learner pages.
 * Shows display name, role label, and a sign-out button that returns the
 * user to `/`. Mirrors the learner Dashboard's HUD chip pattern but without
 * the character art (adult users don't have a character).
 *
 * Renders nothing if no user is loaded — the parent layout's auth gate
 * already prevents anonymous render, this is just defensive.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex items-center gap-3 panel px-4 py-2">
      <div className="leading-tight">
        <div className="font-display text-sm text-glow-primary">{user.displayName}</div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground flex items-center gap-1.5">
          <RoleIcon role={user.role} />
          {user.role}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="ml-2 h-9 w-9 rounded-lg border border-border/60 hover:border-destructive hover:text-destructive flex items-center justify-center transition-all"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
