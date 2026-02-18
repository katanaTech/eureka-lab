import type {
  ApiResponse,
  ApiError,
  UserProfile,
} from '@eureka-lab/shared-types';

/**
 * Base API request options.
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Fetches the current Firebase ID token for the authenticated user.
 * Imported lazily to avoid Firebase SDK loading on the server.
 *
 * @returns Firebase ID token string, or null if not authenticated
 */
async function getFirebaseToken(): Promise<string | null> {
  try {
    // Dynamic import prevents SSR issues with Firebase client SDK
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper that attaches auth headers and handles errors.
 *
 * @param path - API path (e.g. '/auth/me')
 * @param options - Request options
 * @returns Parsed response data
 * @throws ApiError on non-2xx responses
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured');

  const token = await getFirebaseToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      statusCode: response.status,
      error: response.statusText,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    }));
    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}

/**
 * Typed API client for the Eureka Lab Platform backend.
 * All components and hooks must use this — never call fetch() directly.
 *
 * Contracts: planning/api-contracts.md
 */
export const apiClient = {
  auth: {
    /**
     * Exchange a Firebase ID token for the enriched user profile.
     * @param idToken - Firebase ID token from the client SDK
     */
    login: (idToken: string): Promise<UserProfile> =>
      request<UserProfile>('/auth/login', {
        method: 'POST',
        body: { idToken },
      }),

    /**
     * Get the current authenticated user's profile.
     */
    me: (): Promise<UserProfile> => request<UserProfile>('/auth/me'),

    /**
     * Sign up a new parent account.
     */
    signup: (data: {
      email: string;
      password: string;
      displayName: string;
    }): Promise<{ uid: string; email: string; token: string }> =>
      request('/auth/signup', {
        method: 'POST',
        body: { ...data, role: 'parent' },
      }),

    /**
     * Invalidate the current session server-side.
     */
    logout: (): Promise<void> =>
      request<void>('/auth/logout', { method: 'POST' }),

    /**
     * Add a child sub-account under the authenticated parent.
     */
    addChild: (data: {
      displayName: string;
      birthYear: number;
    }): Promise<{
      uid: string;
      displayName: string;
      role: 'child';
      age: number;
      parentUid: string;
      plan: 'free';
    }> =>
      request('/auth/add-child', { method: 'POST', body: data }),
  },
};
