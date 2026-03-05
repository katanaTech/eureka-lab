'use client';

import { type FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';

/**
 * Firebase client configuration.
 * CLAUDE.md Rule 18: All SDKs go through an abstraction layer.
 * CLAUDE.md Rule 2: API keys are NOT secrets for Firebase client — they're public identifiers.
 *
 * Uses lazy initialization to avoid errors during Next.js static page generation
 * and during local development when Firebase env vars are not set.
 */
const firebaseConfig = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] ?? '',
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] ?? '',
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] ?? '',
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] ?? '',
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] ?? '',
};

/**
 * Check whether Firebase is configured with real credentials.
 * @returns True if a Firebase API key is set
 */
export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _initFailed = false;

/**
 * Get the Firebase app instance (lazy singleton).
 * Returns undefined if Firebase is not configured.
 *
 * @returns Firebase app instance or undefined
 */
function getApp(): FirebaseApp | undefined {
  if (_initFailed || !isFirebaseConfigured()) return undefined;

  if (!_app) {
    try {
      _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    } catch {
      _initFailed = true;
      return undefined;
    }
  }
  return _app;
}

/**
 * Get the Firebase Auth instance (lazy singleton).
 * Returns undefined if Firebase is not configured.
 *
 * @returns Firebase Auth instance or undefined
 */
function getFirebaseAuth(): Auth | undefined {
  if (_initFailed) return undefined;

  if (!_auth) {
    const app = getApp();
    if (!app) return undefined;
    try {
      _auth = getAuth(app);
    } catch {
      _initFailed = true;
      return undefined;
    }
  }
  return _auth;
}

/**
 * Firebase Auth instance — lazily initialized on first access.
 * Returns undefined if Firebase is not configured (no API key).
 * All consumers must handle the undefined case.
 */
export const auth: Auth | undefined = isFirebaseConfigured()
  ? new Proxy({} as Auth, {
      get(_target, prop: string | symbol) {
        const realAuth = getFirebaseAuth();
        if (!realAuth) return undefined;
        const value = Reflect.get(realAuth, prop);
        if (typeof value === 'function') {
          return value.bind(realAuth);
        }
        return value;
      },
      set(_target, prop: string | symbol, value: unknown) {
        const realAuth = getFirebaseAuth();
        if (!realAuth) return false;
        return Reflect.set(realAuth, prop, value);
      },
    })
  : undefined;

export default getApp;
