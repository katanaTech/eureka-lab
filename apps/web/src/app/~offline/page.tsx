'use client';

import { WifiOff } from 'lucide-react';

/**
 * Offline fallback page served by the service worker when a navigation
 * request fails and no cached version of the page is available.
 * Uses minimal dependencies — no i18n hooks or providers required.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          You are offline
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your internet connection and try again.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        type="button"
      >
        Try Again
      </button>
    </div>
  );
}
