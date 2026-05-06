'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';

type AuthMode = 'login' | 'register';

/**
 * Maps Firebase auth error codes to translation keys under the
 * `Phase16Welcome` namespace. The caller resolves the key with
 * `useTranslations('Phase16Welcome')` so messages stay i18n-aware.
 *
 * @param code - The Firebase auth error code (e.g. `auth/wrong-password`)
 * @returns The translation key (without namespace prefix)
 */
function getFirebaseErrorMessageKey(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'errorEmailInUse',
    'auth/invalid-email': 'errorInvalidEmail',
    'auth/weak-password': 'errorWeakPassword',
    'auth/user-not-found': 'errorUserNotFound',
    'auth/wrong-password': 'errorWrongPassword',
    'auth/too-many-requests': 'errorTooManyRequests',
    'auth/popup-closed-by-user': 'errorPopupClosed',
    'auth/network-request-failed': 'errorNetwork',
  };
  return map[code] ?? 'errorUnexpected';
}

/**
 * Welcome page — auth entry point for the game mode.
 * Handles both registration and login via Firebase Auth.
 * On success, the existing auth observer (in Providers) updates useAuthStore.
 *
 * @returns The welcome/auth screen component
 */
export default function WelcomePage() {
  const router = useRouter();
  const t = useTranslations('Phase16Welcome');
  const [mode, setMode] = useState<AuthMode>('login');
  const [heroName, setHeroName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles email/password authentication (login or register).
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) {
      toast.error(t('errorAuthNotConfigured'));
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Optionally update display name — fire and forget
        if (heroName && credential.user) {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(credential.user, { displayName: heroName }).catch(() => null);
        }
        // New users always go to character creator
        router.replace('/g/character');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Returning users: auth observer will set user; navigate to dashboard
        router.replace('/g/dashboard');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(t(getFirebaseErrorMessageKey(code)));
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handles Google OAuth sign-in via popup.
   */
  async function handleGoogleSignIn() {
    if (!auth) {
      toast.error(t('errorAuthNotConfigured'));
      return;
    }
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Redirect depends on whether character exists — check via /g entry page
      router.replace('/g');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(t(getFirebaseErrorMessageKey(code)));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Scene className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <Logo />
        <div className="mt-2">
          <h1 className="font-display text-4xl text-glow-primary uppercase tracking-widest">
            {t('heading')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground tracking-wider">
            {t('subheading')}
          </p>
        </div>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm p-8 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
        {/* Tab switcher */}
        <div className="mb-8 flex rounded-lg border border-primary/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={[
              'flex-1 py-2.5 text-sm font-display uppercase tracking-wider transition-colors',
              mode === 'login'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t('tabLogin')}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={[
              'flex-1 py-2.5 text-sm font-display uppercase tracking-wider transition-colors',
              mode === 'register'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t('tabRegister')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Hero Name — register only */}
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="heroName"
                className="text-xs font-display uppercase tracking-widest text-primary/80"
              >
                {t('heroNameLabel')}
              </label>
              <input
                id="heroName"
                type="text"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                placeholder={t('heroNamePlaceholder')}
                autoComplete="name"
                className="h-11 rounded-lg border border-primary/30 bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-display uppercase tracking-widest text-primary/80"
            >
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              autoComplete="email"
              className="h-11 rounded-lg border border-primary/30 bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-display uppercase tracking-widest text-primary/80"
            >
              {t('passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              className="h-11 rounded-lg border border-primary/30 bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <GameButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="mt-2 w-full"
          >
            {isSubmitting
              ? t('submitting')
              : mode === 'register'
              ? t('submitRegister')
              : t('submitLogin')}
          </GameButton>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-primary/20" />
          <span className="text-xs text-muted-foreground">{t('orDivider')}</span>
          <span className="h-px flex-1 bg-primary/20" />
        </div>

        {/* Google sign-in */}
        <GameButton
          type="button"
          variant="ghost"
          size="md"
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
          className="w-full"
        >
          <svg
            aria-hidden
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('googleSignIn')}
        </GameButton>
      </div>

      <p className="mt-8 text-xs text-muted-foreground/60 text-center max-w-sm">
        {t('termsNotice')}
      </p>
    </Scene>
  );
}
