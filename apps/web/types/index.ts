/**
 * Frontend-only types — not shared with the backend.
 * Backend-shared types live in packages/shared-types.
 */

/** Route groups used in the App Router */
export type RouteGroup = '(auth)' | '(dashboard)';

/** Toast notification variants */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

/** Skeleton loading state for module cards */
export interface ModuleCardSkeleton {
  id: string;
  isLoading: true;
}

/** UI state for the prompt editor */
export interface PromptEditorState {
  prompt: string;
  isSubmitting: boolean;
  charCount: number;
  maxChars: number;
}

/** Navigation item definition */
export interface NavItem {
  labelKey: string;
  href: string;
  icon?: string;
  requiresRole?: string[];
}
