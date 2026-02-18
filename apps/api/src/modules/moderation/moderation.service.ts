import { Injectable, NotImplementedException } from '@nestjs/common';
import { ScreenInputResultDto } from './dto/screen-input-result.dto';
import { ScreenOutputResultDto } from './dto/screen-output-result.dto';

/**
 * Content moderation service.
 *
 * Implements the two-layer safety pipeline required by CLAUDE.md Rules 11–13.
 * BE agent implements this in BE-021 (Layer 1) and BE-022 (Layer 2).
 *
 * Layer 1 — screenInput():  runs BEFORE the prompt reaches the AI gateway.
 * Layer 2 — screenOutput(): runs AFTER the AI response, BEFORE it reaches the client.
 *
 * QA adversarial test suite: moderation.service.spec.ts
 * Required coverage: 95% (qa-rules.md §3)
 */
@Injectable()
export class ModerationService {
  /**
   * Layer 1: Screen user input before it is sent to the AI.
   * Blocks jailbreak attempts, PII, and harmful content.
   *
   * @param input - Raw user prompt text
   * @returns Screening result — isAllowed=false means the prompt is blocked
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async screenInput(_input: string): Promise<ScreenInputResultDto> {
    // BE-021: implement Layer 1 moderation
    throw new NotImplementedException('ModerationService.screenInput not yet implemented — see BE-021');
  }

  /**
   * Layer 2: Screen AI output before it is returned to the client.
   * Catches harmful content that slipped through the system prompt.
   *
   * @param output - Raw AI response text
   * @returns Screening result — flagged=true means the response is suppressed
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async screenOutput(_output: string): Promise<ScreenOutputResultDto> {
    // BE-022: implement Layer 2 moderation
    throw new NotImplementedException('ModerationService.screenOutput not yet implemented — see BE-022');
  }
}
