import { SignupForm } from '@/components/features/auth/SignupForm';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import Link from 'next/link';

/** Force dynamic rendering — Firebase client SDK needs runtime env vars */
export const dynamic = 'force-dynamic';

/**
 * Standalone Signup page for parent account creation. Re-skinned in fantasy
 * chrome; SignupForm itself unchanged (Firebase + parental-consent flow).
 * Welcome (`/`) covers the MVP path; this page exists for direct links.
 */
export default function SignupPage() {
  return (
    <Scene>
      <main className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="panel max-w-md w-full p-6 sm:p-8 rune-ring animate-fade-in-up">
          <h1 className="font-display text-3xl text-glow-primary text-center">Begin Quest</h1>
          <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground text-center mt-2">
            Forge your hero account
          </p>
          <div className="mt-6">
            <SignupForm />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Returning hero?{' '}
            <Link href="/login" className="text-primary hover:text-glow-primary">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </Scene>
  );
}
