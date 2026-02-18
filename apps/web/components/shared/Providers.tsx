'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side provider tree.
 * Wraps the app with TanStack Query (server state).
 * Zustand stores are used directly — no provider needed.
 *
 * Additional providers added here as features grow:
 * - Auth listener (FE-013)
 * - Toast notifications (FE-005)
 */
export function Providers({ children }: ProvidersProps): React.ReactElement {
  // Create a new QueryClient per session to avoid shared state between users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
