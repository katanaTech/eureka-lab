import { IsEnum, IsOptional } from 'class-validator';
import type { UiMode } from '@eureka-lab/shared-types';

/**
 * DTO for updating a user's settings.
 * Currently supports setting the UI mode preference.
 */
export class UpdateSettingsDto {
  /**
   * The preferred UI mode for this user.
   * When set, overrides the default unless the tenant has a lock in place.
   */
  @IsOptional()
  @IsEnum(['normal', 'gamified'])
  uiMode?: UiMode;
}
