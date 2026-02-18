/**
 * Moderation detection patterns.
 * These are used by ModerationService to screen inputs and outputs.
 * Patterns are maintained here so they can be updated centrally.
 *
 * SECURITY NOTE: Adding new bypass patterns requires a QA review to ensure
 * the corresponding adversarial test cases are also added.
 */

/**
 * Regex patterns that indicate a jailbreak attempt.
 * Matches case-insensitively.
 */
export const JAILBREAK_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /forget\s+(your|all)\s+instructions/i,
  /\bDAN\s+mode\b/i,
  /act\s+as\s+(an?\s+)?ai\s+(with(out)?|that\s+has)\s+(no|without)\s+(safety|filter|restriction|guideline)/i,
  /you\s+(are\s+now|have)\s+no\s+restriction/i,
  /disable\s+(content\s+)?filter/i,
  /emergency\s+debug\s+mode/i,
  /developer\s+override\s+(code|mode)/i,
  /override[-\s]?\d{3,}/i,
  /pretend\s+(you\s+are\s+)?a\s+human/i,
  /system\s+(prompt|message)\s+(said|told|allow)/i,
  /jailbreak/i,
  /\[SYSTEM\]/i,
  /\bSUDO\b/,
];

/**
 * Regex patterns that indicate Personally Identifiable Information (PII).
 * CLAUDE.md Rule 13: Child PII must never appear in AI prompts.
 */
export const PII_PATTERNS: RegExp[] = [
  // Phone numbers (international + local formats)
  /(\+?\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/,
  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // Street addresses (number + street name pattern)
  /\d{1,5}\s+[a-zA-Z\s]{3,}\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|court|ct)\b/i,
  // Social media handles
  /@[a-zA-Z0-9_]{2,30}\b/,
  // IP addresses
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
];

/**
 * Keywords indicating harmful content requests.
 * Intentionally kept vague here — full implementation in ModerationService.
 */
export const HARMFUL_CONTENT_SIGNALS: string[] = [
  'self-harm',
  'suicide',
  'how to make a bomb',
  'how to make drugs',
  'how to hurt',
  'instructions for violence',
];
