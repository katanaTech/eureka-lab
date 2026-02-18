/**
 * Result of Layer 1 input screening.
 * Returned by ModerationService.screenInput().
 */
export class ScreenInputResultDto {
  /** Whether the input is allowed to proceed to the AI gateway */
  isAllowed: boolean;

  /**
   * Category of the detected violation.
   * Undefined when isAllowed is true.
   */
  flagType?: 'jailbreak' | 'pii' | 'harmful' | 'adult_content' | 'off_topic';

  /** Human-readable reason for rejection (for logging, never shown to child) */
  reason?: string;

  /** Severity of the detected violation */
  severity?: 'low' | 'medium' | 'high';
}
