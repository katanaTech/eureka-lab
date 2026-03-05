'use client';

import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  /** The error that was thrown */
  error: Error & { digest?: string };
  /** Function to retry rendering */
  reset: () => void;
}

/**
 * Global error page — shown when an unhandled error occurs.
 * Next.js App Router catches errors and renders this component.
 *
 * @param error - The caught error
 * @param reset - Retry function
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Something went wrong. Don&apos;t worry, it&apos;s not your fault.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
