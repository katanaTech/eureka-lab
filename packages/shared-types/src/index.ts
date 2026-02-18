/**
 * Shared TypeScript types for the Eureka Lab Platform.
 * Used by both apps/web and apps/api.
 *
 * @module @eureka-lab/shared-types
 */

// ── User & Auth ───────────────────────────────────────────────────────────────

/** User roles in the platform */
export type UserRole = 'child' | 'parent' | 'teacher' | 'admin';

/** Platform subscription plans */
export type PlanType = 'free' | 'explorer' | 'creator';

/** Core user profile (safe to share between FE/BE) */
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  plan: PlanType;
  displayName: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ── Learning Levels ───────────────────────────────────────────────────────────

/** The four learning levels of the platform */
export type LevelId = 1 | 2 | 3 | 4;

/** Module completion status */
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';

// ── API Response Wrappers ─────────────────────────────────────────────────────

/** Standard API success response */
export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

/** Standard API error response */
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

/** Feature flag keys — add new flags here before using anywhere */
export interface FeatureFlags {
  level2Enabled: boolean;
  level3Enabled: boolean;
  level4Enabled: boolean;
  stripeEnabled: boolean;
  moderationEnabled: boolean;
}
