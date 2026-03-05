import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNumber,
} from 'class-validator';

/**
 * DTO for marking a module activity as complete.
 * Per api-contracts.md: POST /progress/:moduleId/complete
 */
export class CompleteActivityDto {
  /** Activity index within the module */
  @IsInt()
  @Min(0)
  activityIndex!: number;

  /** Child's response text (for reflection activities) */
  @IsString()
  @IsOptional()
  response?: string;

  /** Score (0–1) if auto-graded */
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  score?: number;
}
