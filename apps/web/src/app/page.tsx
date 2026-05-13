'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { toast } from 'sonner';
import { Scene } from '@/components/game/Scene';
import { Logo } from '@/components/game/Logo';
import { GameButton } from '@/components/game/GameButton';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

const worldBg = '/assets/game/world-map.jpg';

type Mode = 'login' | 'register';

/**
 * Welcome / landing page — fantasy "Awakening" entry point.
 * Auth-gated: redirects authenticated users to /dashboard.
 * Submit handler is currently a stub; Firebase wiring lands in Task 2.3.
 */
export default function WelcomePage() {
  const [mode, setMode] = useState<Mode>('register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return toast.error('Auth is not available.');

    try {
      if (mode === 'register') {
        if (!username.trim() || !email.trim() || !password) {
          return toast.error('Fill in all the runes, hero.');
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: username.trim() });
        toast.success(`Welcome to the realm, ${username.trim()}!`);
        router.push('/character');
      } else {
        if (!email.trim() || !password) {
          return toast.error('Email and password required.');
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
        const displayName = email.trim().split('@')[0];
        toast.success(`Welcome back, ${displayName}.`);
        router.push('/dashboard');
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Auth failed.';
      toast.error(msg);
    }
  };

  const handleGoogle = async () => {
    if (!auth) return toast.error('Auth is not available.');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      toast.success(`Welcome, ${cred.user.displayName ?? 'Hero'}.`);
      router.push('/character');
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Google sign-in failed.';
      toast.error(msg);
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

          <div className="panel rune-ring p-6 sm:p-8">
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
              {(['register', 'login'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
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
                <Field label="Hero Name" value={username} onChange={setUsername} placeholder="e.g. Stormrider" />
              )}
              <Field label="Email Sigil" value={email} onChange={setEmail} placeholder="hero@realm.io" type="email" />
              <Field label="Secret Rune" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

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
        </section>
      </main>
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
  /** Input type (text | email | password) */
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
