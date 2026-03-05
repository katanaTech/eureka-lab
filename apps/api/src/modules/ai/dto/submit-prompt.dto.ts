import { IsString, IsOptional, MaxLength, MinLength, IsNotEmpty } from 'class-validator';

/**
 * DTO for submitting a prompt to the AI gateway.
 * Per api-contracts.md: POST /ai/prompt
 */
export class SubmitPromptDto {
  /** Module identifier, e.g. 'l1-m1-what-is-a-prompt' */
  @IsString()
  @IsNotEmpty()
  moduleId!: string;

  /** The user's prompt text (max 500 chars for Level 1) */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  prompt!: string;

  /** Optional additional context */
  @IsString()
  @IsOptional()
  @MaxLength(300)
  context?: string;
}
