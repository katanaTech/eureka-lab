/**
 * DTO for querying the leaderboard.
 * @module leaderboard-query.dto
 */

import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/** Query parameters for the leaderboard endpoint */
export class LeaderboardQueryDto {
  /** Maximum number of entries to return (default 10, max 50) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
