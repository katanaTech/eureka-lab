'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { toast } from 'sonner';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { authApi, coppaApi } from '@/lib/api-client';
import { homeForRole } from '@/lib/auth-redirects';
import { OAuthBirthYearModal } from '@/components/features/auth/OAuthBirthYearModal';

const worldBg = '/assets/game/world-map.jpg';

type Mode = 'login' | 'register';

/** Minimum and maximum playable age. Under-13 is gated pending Plan 3 COPPA pipeline (ADR-006). */
const MIN_AGE = 13;
const MAX_AGE = 16;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Welcome / landing page — fantasy "Awakening" entry point.
 *
 * Auth-gated: redirects authenticated users to /dashboard.
 *
 * Per ADR-006, the "Begin Quest" tab is the **kid signup** surface (ages
 * 13–16, role 'child'). Under-13 is blocked with a "parent confirmation
 * coming soon" message until Plan 3 ships the COPPA pipeline. Adult/parent
 * accounts sign up via the standalone /signup route.
 */
export default function WelcomePage() {
  const [mode, setMode] = useState<Mode>('register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [pendingOAuthUser, setPendingOAuthUser] = useState<{ uid: string } | null>(null);
  const [under13Mode, setUnder13Mode] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(homeForRole(user.role));
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return null;

  /**
   * Surface an error both inline (persistent, reliable) and as a toast.
   * The inline banner is the load-bearing channel; the toast is a bonus.
   */
  const fail = (msg: string) => {
    setFormError(msg);
    toast.error(msg);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!auth) return fail('Auth is not available.');

    // Under-13 COPPA branch: collect the parent's email and create a pending
    // account instead of a real one (P3-16). The backend emails the parent a
    // confirmation link; no Firebase user exists until they click it.
    if (under13Mode) {
      if (!parentEmail.trim()) {
        return fail('Parent email required.');
      }
      try {
        const yearNum = Number(birthYear);
        const result = await coppaApi.createPendingChild({
          email: email.trim(),
          parentEmail: parentEmail.trim(),
          displayName: username.trim(),
          birthYear: yearNum,
        });
        setPendingToken(result.token);
        toast.success('A confirmation rune has flown to your parent.');
      } catch (err) {
        const msg = (err as { message?: string })?.message ?? 'Pending signup failed.';
        fail(msg);
      }
      return;
    }

    try {
      if (mode === 'register') {
        if (!username.trim() || !email.trim() || !password || !birthYear.trim()) {
          return fail('Fill in all the runes, hero.');
        }
        const year = Number(birthYear);
        if (!Number.isInteger(year) || year < 1900 || year > CURRENT_YEAR) {
          return fail('Year of birth looks odd, hero.');
        }
        // Backend signup creates the Firebase user (Admin SDK) + Firestore
        // profile + custom claims, and now derives the role from birthYear
        // (P3-14). Doing this client-side via createUserWithEmailAndPassword
        // skips the Firestore doc and breaks useAuth's authApi.getMe() lookup.
        try {
          await authApi.signup({
            email: email.trim(),
            password,
            displayName: username.trim(),
            birthYear: year,
          });
        } catch (err) {
          // api-client throws ApiError with a top-level `code`. UNDER_13
          // pivots to the COPPA form (Phase C); AGE_GAP surfaces as a toast.
          const apiErr = err as { code?: string };
          if (apiErr.code === 'UNDER_13_PIPELINE_REQUIRED') {
            setFormError('');
            setUnder13Mode(true);
            toast.message('Almost there — we just need a grown-up to confirm.');
            return;
          }
          if (apiErr.code === 'AGE_GAP') {
            return fail('Heroes are 13–16. Contact support if you are 17.');
          }
          throw err;
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success(`Welcome to the realm, ${username.trim()}!`);
        router.push('/character');
      } else {
        if (!email.trim() || !password) {
          return fail('Email and password required.');
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // Fetch profile now so we can route by role; useAuth will also pick it
        // up via onAuthStateChanged, but we don't want to flash /dashboard on
        // the way to /parent or /teacher.
        const profile = await authApi.getMe();
        const displayName = profile.displayName || email.trim().split('@')[0];
        toast.success(`Welcome back, ${displayName}.`);
        router.push(homeForRole(profile.role));
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Auth failed.';
      fail(msg);
    }
  };

  const handleGoogle = async () => {
    if (!auth) return toast.error('Auth is not available.');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      toast.success(`Welcome, ${cred.user.displayName ?? 'Hero'}.`);

      // Try to fetch existing profile. If 404, this is a first-time OAuth
      // user — show the birthYear modal so we can complete the signup.
      try {
        const profile = await authApi.getMe();
        router.push(homeForRole(profile.role));
      } catch (err) {
        const apiErr = err as { statusCode?: number };
        if (apiErr.statusCode === 404) {
          setPendingOAuthUser({ uid: cred.user.uid });
          setOauthModalOpen(true);
          return;
        }
        throw err;
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Google sign-in failed.';
      toast.error(msg);
    }
  };

  const handleOAuthBirthYearSubmit = async (birthYear: number) => {
    if (!pendingOAuthUser) return;
    try {
      const result = await authApi.completeOAuthSignup({ birthYear });
      setOauthModalOpen(false);
      setPendingOAuthUser(null);
      toast.success('Identity forged. Onward, hero.');
      router.push(homeForRole(result.role));
    } catch (err) {
      // api-client throws ApiError with a top-level `code`. Re-throw a
      // friendly message so the modal surfaces it in its error slot.
      const code = (err as { code?: string }).code;
      if (code === 'UNDER_13_PIPELINE_REQUIRED') {
        throw new Error('Under 13 OAuth: parent confirmation coming in Phase C.');
      }
      if (code === 'AGE_GAP') {
        throw new Error('Heroes are 13–16. Contact support if you are 17.');
      }
      throw err;
    }
  };

  const handleOAuthCancel = async () => {
    // User backed out of the birthYear collection — sign them out of Firebase
    // so we don't leave an orphan session lying around.
    setOauthModalOpen(false);
    setPendingOAuthUser(null);
    if (auth) {
      try {
        await auth.signOut();
      } catch {
        /* best-effort */
      }
    }
  };

  return (
    <Scene background={worldBg}>
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <header className="absolute top-6 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0">
          <Logo />
        </header>

        <section className="w-full max-w-md mt-24 sm:mt-0 animate-fade-in-up">
          <div className="text-center mb-8 space-y-2">
            <p className="text-xs tracking-[0.5em] text-primary/80">A NEW LEGEND BEGINS</p>
            <h1 className="font-display text-4xl sm:text-5xl text-glow-primary">
              The Awakening
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Four islands. Four trials. Master the AI arts and drive the Babble Zombies back into the void.
            </p>
          </div>

          {pendingToken ? (
            <div className="panel rune-ring p-8 text-center">
              <h2 className="font-display text-2xl text-glow-primary">Awaiting Parent&apos;s Confirmation</h2>
              <p className="text-sm text-muted-foreground mt-3">
                We sent a confirmation rune to <span className="text-primary">{parentEmail}</span>.
                Once a grown-up clicks the link, your hero account will be ready.
              </p>
              <p className="text-[11px] text-muted-foreground mt-3">
                The link expires in 7 days. You can close this window.
              </p>
            </div>
          ) : (
          <div className="panel rune-ring p-6 sm:p-8">
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
              {(['register', 'login'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setFormError(''); }}
                  className={`flex-1 h-10 rounded-lg text-xs font-display tracking-widest uppercase transition-all ${
                    mode === m
                      ? 'bg-gradient-primary text-primary-foreground glow-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'register' ? 'Begin Quest' : 'Return Hero'}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {mode === 'register' && (
                <>
                  <Field label="Hero Name" value={username} onChange={setUsername} placeholder="e.g. Stormrider" />
                  <Field
                    label={`Year of Birth (${MIN_AGE}–${MAX_AGE} only)`}
                    value={birthYear}
                    onChange={setBirthYear}
                    placeholder={`${CURRENT_YEAR - MAX_AGE}–${CURRENT_YEAR - MIN_AGE}`}
                    type="number"
                  />
                  {under13Mode && (
                    <Field
                      label="Parent's Email Sigil"
                      value={parentEmail}
                      onChange={setParentEmail}
                      placeholder="grownup@realm.io"
                      type="email"
                    />
                  )}
                </>
              )}
              <Field label="Email Sigil" value={email} onChange={setEmail} placeholder="hero@realm.io" type="email" />
              <Field label="Secret Rune" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

              {formError && (
                <p role="alert" className="text-sm text-destructive text-center">
                  {formError}
                </p>
              )}

              <GameButton type="submit" size="lg" className="w-full mt-2">
                {mode === 'register' ? 'Forge My Legend' : 'Enter the Realm'}
              </GameButton>

              <p className="text-[11px] text-center text-muted-foreground pt-2">
                By entering, you swear to fight zombies with curiosity, not cheats.
              </p>
            </form>

            <GameButton
              type="button"
              variant="ghost"
              size="lg"
              className="w-full mt-3"
              onClick={handleGoogle}
            >
              Sign in with the Google Sigil
            </GameButton>
          </div>
          )}
        </section>
      </main>

      <OAuthBirthYearModal
        open={oauthModalOpen}
        onSubmit={handleOAuthBirthYearSubmit}
        onCancel={handleOAuthCancel}
      />
    </Scene>
  );
}

interface FieldProps {
  /** Field label text (uppercase tracking) */
  label: string;
  /** Controlled value */
  value: string;
  /** Change handler receiving the raw value */
  onChange: (v: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type (text | email | password | number) */
  type?: string;
}

/**
 * Themed labelled input for the Welcome form.
 * @param props - Field props (label, value, onChange, placeholder, type)
 * @returns A label element wrapping a styled input
 */
function Field({ label, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-[11px] font-display tracking-[0.3em] uppercase text-primary/80 mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 rounded-xl bg-input border border-border/70 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 transition-all"
      />
    </label>
  );
}
