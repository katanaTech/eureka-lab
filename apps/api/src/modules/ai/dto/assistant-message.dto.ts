import { IsString, IsOptional, MaxLength, MinLength, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Context about the user's current location in the app.
 */
export class AssistantContextDto {
  /** Current route path */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  currentRoute?: string;

  /** Module ID if on a module page */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  moduleId?: string;

  /** Activity index if viewing an activity */
  @IsOptional()
  activityIndex?: number;
}

/**
 * DTO for the AI assistant chat endpoint.
 * POST /ai/assistant
 */
export class AssistantMessageDto {
  /** The user's message text */
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  /** App context for contextual responses */
  @IsOptional()
  @ValidateNested()
  @Type(() => AssistantContextDto)
  context?: AssistantContextDto;
}
