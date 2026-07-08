'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Scene } from '@/components/game/Scene';
import { Logo, GameButton } from '@eureka-lab/ui';
import { coppaApi } from '@/lib/api-client';

/** Force dynamic — token is per-request and the page calls a public POST. */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { token: string };
}

/**
 * Public COPPA confirmation page. The parent receives an email with a link
 * to /confirm-parent/[token]; clicking it lands here. The page POSTs the
 * token to the backend on mount (single-click confirmation — the parent
 * doesn't need to do anything else).
 *
 * Once confirmed, we surface a "your kid can now sign in" message and a
 * link to /login. The backend has generated a password-reset link for the
 * kid (logged server-side in Plan 3b C.3); follow-up plan iteration may
 * email that link separately.
 */
export default function ConfirmParentPage({ params }: PageProps) {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  // Guard against React StrictMode's dev double-mount firing the confirm
  // POST twice. The ref persists across the simulated remount, so the
  // request runs exactly once and its result is the one rendered.
  const didConfirm = useRef(false);

  useEffect(() => {
    if (didConfirm.current) return;
    didConfirm.current = true;
    (async () => {
      try {
        await coppaApi.confirmParentEmail({ token: params.token });
        setState('success');
      } catch (err) {
        // api-client throws ApiError with top-level `code` + `message`.
        const apiErr = err as { code?: string; message?: string };
        const msg = apiErr.message ?? 'Confirmation failed.';
        setErrorMessage(
          apiErr.code === 'TOKEN_EXPIRED'
            ? 'The link expired. Ask the hero to sign up again.'
            : msg,
        );
        setState('error');
      }
    })();
  }, [params.token]);

  return (
    <Scene>
      <main className="relative flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Logo />
        </div>
        <div className="panel rune-ring max-w-md w-full p-8 text-center animate-fade-in-up">
          {state === 'loading' && (
            <>
              <h1 className="font-display text-2xl text-glow-primary">Confirming…</h1>
              <p className="text-sm text-muted-foreground mt-3">The runes are aligning.</p>
            </>
          )}
          {state === 'success' && (
            <>
              <h1 className="font-display text-2xl text-glow-primary">Hero Confirmed</h1>
              <p className="text-sm text-muted-foreground mt-3">
                The account is ready. Tell your hero they can sign in now — they may need to
                reset their password from the login page.
              </p>
              <Link href="/login" className="inline-block mt-6">
                <GameButton variant="primary">Go to Sign-in</GameButton>
              </Link>
            </>
          )}
          {state === 'error' && (
            <>
              <h1 className="font-display text-2xl text-destructive">Confirmation failed</h1>
              <p className="text-sm text-muted-foreground mt-3">{errorMessage}</p>
              <Link href="/" className="inline-block mt-6">
                <GameButton variant="ghost">Back to Welcome</GameButton>
              </Link>
            </>
          )}
        </div>
      </main>
    </Scene>
  );
}
