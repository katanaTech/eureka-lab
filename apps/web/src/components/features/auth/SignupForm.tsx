'use client';

import { type FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { homeForRole } from '@/lib/auth-redirects';

const CURRENT_YEAR = new Date().getFullYear();
/** Adult signup requires age 18+; backend rejects 13–16 (kid) and 17 (gap). */
const ADULT_MIN_AGE = 18;

/**
 * Adult-account signup form (parent or, post-Plan-3b, age-derived).
 * Per Plan 3b A.1, the backend derives role from birthYear; this form
 * just collects birthYear and lets the server decide. Today only
 * age 18+ resolves to a parent account; teacher signup is a separate
 * deferred flow (ROADMAP Stream 4 gap).
 */
export const SignupForm: FC = () => {
  const t = useTranslations('Auth');
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /** Handle adult signup. */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }
    setError('');

    const yearNum = Number(birthYear);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > CURRENT_YEAR) {
      setError('Year of birth looks odd.');
      return;
    }
    if (CURRENT_YEAR - yearNum < ADULT_MIN_AGE) {
      setError(`Adult signup is for ages ${ADULT_MIN_AGE}+. Heroes 13–16 sign up via the Welcome page.`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.signup({
        email,
        password,
        displayName,
        birthYear: yearNum,
      });

      await createUserWithEmailAndPassword(auth, email, password).catch(() => {
        /* User was already created by the backend — sign in instead */
      });

      setUser({
        uid: result.uid,
        email: result.email,
        displayName: result.displayName,
        role: result.role as 'parent',
        plan: 'free',
        xp: 0,
        streak: 0,
        level: 1,
      });

      router.push(homeForRole(result.role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('signupTitle')}</h1>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium text-foreground">
            {t('displayName')}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="birthYear" className="text-sm font-medium text-foreground">
            Year of birth
          </label>
          <input
            id="birthYear"
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder={`${CURRENT_YEAR - ADULT_MIN_AGE} or earlier`}
            min={1900}
            max={CURRENT_YEAR - ADULT_MIN_AGE}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '...' : t('signupButton')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <a href="/login" className="font-medium text-primary hover:underline">
          {t('loginButton')}
        </a>
      </p>
    </div>
  );
};
