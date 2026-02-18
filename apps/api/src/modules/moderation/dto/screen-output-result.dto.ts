/**
 * Result of Layer 2 output screening.
 * Returned by ModerationService.screenOutput().
 */
export class ScreenOutputResultDto {
  /** Whether the AI output was flagged as unsafe */
  flagged: boolean;

  /** The (possibly sanitised) output text */
  text: string;

  /**
   * Category of the detected violation in AI output.
   * Undefined when flagged is false.
   */
  flagType?: 'harmful' | 'pii' | 'adult_content';

  /** Reason for flagging (for moderation log, never shown to child) */
  reason?: string;
}
