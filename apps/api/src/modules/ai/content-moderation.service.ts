import { Injectable, Logger } from '@nestjs/common';
import type { ModerationFlagType, ModerationSeverity } from '@eureka-lab/shared-types';

/** Result of a moderation check */
export interface ModerationResult {
  /** Whether the content passed moderation */
  passed: boolean;
  /** Flags raised (empty if passed) */
  flags: ModerationCheckFlag[];
}

/** Individual moderation flag detail */
export interface ModerationCheckFlag {
  /** Type of issue detected */
  flagType: ModerationFlagType;
  /** Severity level */
  severity: ModerationSeverity;
  /** Human-readable reason */
  reason: string;
}

/**
 * Content moderation pipeline — input and output filters.
 * CLAUDE.md Rule 4: No raw AI responses without moderation.
 * CLAUDE.md Rule 12: All user-generated content must pass moderation.
 *
 * Uses pattern-based heuristics for MVP. Will integrate a dedicated
 * moderation API (e.g., Anthropic content classifier) in a future sprint.
 */
@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  /** Patterns that indicate harmful content (case-insensitive) */
  private readonly harmfulPatterns: RegExp[] = [
    /\b(kill|murder|suicide|self[- ]?harm|cutting)\b/i,
    /\b(bomb|weapons?|guns?|explosives?|terrorism)\b/i,
    /\b(drugs?|cocaine|heroin|meth|marijuana)\b/i,
  ];

  /** Patterns that indicate adult content */
  private readonly adultPatterns: RegExp[] = [
    /\b(sex|porn|nude|naked|xxx)\b/i,
    /\b(erotic|sexual|intercourse)\b/i,
  ];

  /** Patterns that indicate PII exposure */
  private readonly piiPatterns: RegExp[] = [
    /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,               /* SSN-like */
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i, /* Email */
    /\b\d{10,}\b/,                                     /* Phone-like */
    /\b(my name is|i live at|my school is|my address is)\b/i,
  ];

  /** Patterns indicating jailbreak attempts */
  private readonly jailbreakPatterns: RegExp[] = [
    /\b(ignore (previous|all|above) (instructions|rules|prompts))\b/i,
    /\b(you are now|pretend (you are|to be)|act as|roleplay)\b/i,
    /\b(system prompt|developer mode|dan mode|jailbreak)\b/i,
    /\b(bypass|override|disable|remove) (safety|rules|filters|restrictions)\b/i,
  ];

  /**
   * Check user input (prompt) before sending to AI.
   * CLAUDE.md Rule 12: All user-generated content must pass moderation.
   *
   * @param content - The user's prompt text
   * @returns Moderation result
   */
  moderateInput(content: string): ModerationResult {
    const flags: ModerationCheckFlag[] = [];

    this.checkPatterns(content, this.harmfulPatterns, 'harmful', 'high', flags);
    this.checkPatterns(content, this.adultPatterns, 'adult', 'high', flags);
    this.checkPatterns(content, this.piiPatterns, 'pii', 'medium', flags);
    this.checkPatterns(content, this.jailbreakPatterns, 'jailbreak', 'high', flags);

    if (flags.length > 0) {
      this.logger.warn({
        event: 'moderation_input_flagged',
        flagCount: flags.length,
        flagTypes: flags.map((f) => f.flagType),
      });
    }

    return { passed: flags.length === 0, flags };
  }

  /**
   * Check AI output before returning to the child.
   * CLAUDE.md Rule 4: Never return raw AI responses without moderation.
   *
   * @param content - The AI's response text
   * @returns Moderation result
   */
  moderateOutput(content: string): ModerationResult {
    const flags: ModerationCheckFlag[] = [];

    this.checkPatterns(content, this.harmfulPatterns, 'harmful', 'high', flags);
    this.checkPatterns(content, this.adultPatterns, 'adult', 'high', flags);
    this.checkPatterns(content, this.piiPatterns, 'pii', 'medium', flags);

    if (flags.length > 0) {
      this.logger.warn({
        event: 'moderation_output_flagged',
        flagCount: flags.length,
        flagTypes: flags.map((f) => f.flagType),
      });
    }

    return { passed: flags.length === 0, flags };
  }

  /**
   * Check content against a set of regex patterns.
   *
   * @param content - Text to check
   * @param patterns - Regex patterns to match
   * @param flagType - Moderation flag type
   * @param severity - Severity level
   * @param flags - Mutable array to push flags into
   */
  private checkPatterns(
    content: string,
    patterns: RegExp[],
    flagType: ModerationFlagType,
    severity: ModerationSeverity,
    flags: ModerationCheckFlag[],
  ): void {
    for (const pattern of patterns) {
      const match = pattern.exec(content);
      if (match) {
        flags.push({
          flagType,
          severity,
          reason: `Matched pattern: "${match[0]}"`,
        });
        /* One flag per type is sufficient */
        return;
      }
    }
  }
}
