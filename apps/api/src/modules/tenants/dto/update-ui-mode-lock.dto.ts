import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import type { UiMode } from '@eureka-lab/shared-types';

/**
 * DTO for updating a tenant's UI mode lock configuration.
 * When locked is true and mode is non-null, all users in the tenant are
 * forced into the specified mode regardless of their personal preference.
 */
export class UpdateUiModeLockDto {
  /**
   * The UI mode to lock the tenant to, or null to clear any forced mode.
   */
  @IsOptional()
  @IsEnum(['normal', 'gamified'])
  mode?: UiMode | null;

  /**
   * Whether the lock is active. When true, users cannot override the mode.
   */
  @IsBoolean()
  locked!: boolean;
}
