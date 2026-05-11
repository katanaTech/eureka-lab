import type { KpEarnEvent } from '@eureka-lab/shared-types';

/**
 * KP reward values per event type.
 * These are server-authoritative — never trust the client for KP amounts.
 * Tunable via Firestore remote config post-launch without redeployment.
 */
export const KP_REWARDS: Record<KpEarnEvent, number> = {
  lesson_completed: 10,
  practice_completed: 5,
  minion_defeated: 15,
  guardian_defeated: 30,
  overlord_defeated: 50,
  daily_login: 5,
};

/** Maximum KP a user can earn per calendar day (UTC). Resets at midnight UTC. */
export const DAILY_KP_CAP = 100;
