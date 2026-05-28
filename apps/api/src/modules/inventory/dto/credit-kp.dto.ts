import { IsIn, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import type { KpEarnEvent } from '@eureka-lab/shared-types';

const EVENTS: KpEarnEvent[] = [
  'lesson_completed',
  'practice_completed',
  'minion_defeated',
  'guardian_defeated',
  'overlord_defeated',
  'daily_login',
];

/**
 * Request body for POST /inventory/credit-kp.
 * The server owns the reward amounts (KP_REWARDS) — the client just
 * names the event. `sourceId` provides idempotency: a repeat call with
 * the same sourceId returns the previously-awarded amount without
 * incrementing.
 */
export class CreditKpDto {
  /** Event type — maps to a server-side reward amount via KP_REWARDS. */
  @IsIn(EVENTS, { message: `event must be one of: ${EVENTS.join(', ')}` })
  event!: KpEarnEvent;

  /**
   * Opaque idempotency key. For lessons, use the lessonId. For battles,
   * use the battleId. For daily_login, use the YYYY-MM-DD date.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sourceId!: string;
}
