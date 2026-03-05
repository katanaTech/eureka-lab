/**
 * DTO for querying activity calendar.
 * @module activity-query.dto
 */

import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/** Query parameters for the activity calendar endpoint */
export class ActivityQueryDto {
  /** Number of days of history to retrieve (default 30, max 90) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;
}
