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
 * Maps Firebase auth error codes to i18n keys.
 * @param code - Firebase error code
 * @returns Translation key
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
 * Mobile welcome page — auth entry point for mobile game mode.
 * Mirrors desktop /g/welcome with compact layout and /m/g/ navigation.
 *
 * @returns The mobile welcome/auth screen
 */
export default function MobileWelcomePage() {
  const router = useRouter();
  const t = useTranslations('Phase16Welcome');
  const [mode, setMode] = useState<AuthMode>('login');
  const [heroName, setHeroName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles email/password authentication.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth) { toast.error(t('errorAuthNotConfigured')); return; }
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (heroName && credential.user) {
          const { updateProfile } = await import('firebase/auth');
          await updateProfile(credential.user, { displayName: heroName }).catch(() => null);
        }
        router.replace('/m/g/character');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace('/m/g/dashboard');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(t(getFirebaseErrorMessageKey(code)));
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handles Google OAuth sign-in.
   */
  async function handleGoogleSignIn() {
    if (!auth) { toast.error(t('errorAuthNotConfigured')); return; }
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace('/m/g/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      toast.error(t(getFirebaseErrorMessageKey(code)));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Scene className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      {/* Header — compact for mobile */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Logo />
        <h1 className="font-display text-2xl text-glow-primary uppercase tracking-widest">
          {t('heading')}
        </h1>
        <p className="text-xs text-muted-foreground tracking-wider">
          {t('subheading')}
        </p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm p-6 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
        {/* Tab switcher */}
        <div className="mb-6 flex rounded-lg border border-primary/20 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={[
              'flex-1 py-2 text-xs font-display uppercase tracking-wider transition-colors',
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
              'flex-1 py-2 text-xs font-display uppercase tracking-wider transition-colors',
              mode === 'register'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t('tabRegister')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="heroName" className="text-xs font-display uppercase tracking-widest text-primary/80">
                {t('heroNameLabel')}
              </label>
              <input
                id="heroName" type="text" value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                placeholder={t('heroNamePlaceholder')} autoComplete="name"
                className="h-10 rounded-lg border border-primary/30 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-display uppercase tracking-widest text-primary/80">
              {t('emailLabel')}
            </label>
            <input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')} required autoComplete="email"
              className="h-10 rounded-lg border border-primary/30 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-display uppercase tracking-widest text-primary/80">
              {t('passwordLabel')}
            </label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')} required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              className="h-10 rounded-lg border border-primary/30 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <GameButton type="submit" variant="primary" size="md" disabled={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? t('submitting') : mode === 'register' ? t('submitRegister') : t('submitLogin')}
          </GameButton>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-primary/20" />
          <span className="text-xs text-muted-foreground">{t('orDivider')}</span>
          <span className="h-px flex-1 bg-primary/20" />
        </div>

        <GameButton type="button" variant="ghost" size="sm" disabled={isSubmitting} onClick={handleGoogleSignIn} className="w-full">
          <svg aria-hidden className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('googleSignIn')}
        </GameButton>
      </div>

      <p className="mt-6 text-[10px] text-muted-foreground/60 text-center max-w-xs">
        {t('termsNotice')}
      </p>
    </Scene>
  );
}
