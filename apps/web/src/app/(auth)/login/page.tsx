import { LoginForm } from '@/components/features/auth/LoginForm';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import Link from 'next/link';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars */
export const dynamic = 'force-dynamic';

/**
 * Standalone Login page. Re-skinned in fantasy chrome — the LoginForm
 * itself stays unchanged (still handles Firebase wiring + redirect).
 * Welcome (`/`) covers the MVP path; this page exists for direct links.
 */
export default function LoginPage() {
  return (
    <Scene>
      <main className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="panel max-w-md w-full p-6 sm:p-8 rune-ring animate-fade-in-up">
          <h1 className="font-display text-3xl text-glow-primary text-center">Return Hero</h1>
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground text-center mt-2">
            Sign in to continue your quest
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            New to the realm?{' '}
            <Link href="/signup" className="text-primary hover:text-glow-primary">
              Begin your quest
            </Link>
          </p>
        </div>
      </main>
    </Scene>
  );
}
