'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a TanStack Query client with sensible defaults.
 * gcTime of 30 minutes ensures cached data remains available during
 * short offline periods for read-only page rendering.
 * @returns Configured QueryClient instance
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Get or create a singleton QueryClient for the browser.
 * On the server, always creates a new instance to avoid sharing state.
 * @returns QueryClient instance
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
