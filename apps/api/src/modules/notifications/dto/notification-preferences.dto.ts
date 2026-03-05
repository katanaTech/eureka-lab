/**
 * DTO for updating notification preferences.
 * CLAUDE.md Rule 10: All API endpoints must have input validation.
 *
 * @module notification-preferences.dto
 */

import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

/** Request body for PUT /notifications/preferences */
export class UpdateNotificationPreferencesDto {
  /** Master toggle for all notifications */
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  /** Daily streak reminder toggle */
  @IsOptional()
  @IsBoolean()
  streakReminders?: boolean;

  /** Parent alerts about child activity toggle */
  @IsOptional()
  @IsBoolean()
  parentAlerts?: boolean;

  /** New badge earned notification toggle */
  @IsOptional()
  @IsBoolean()
  newBadges?: boolean;

  /** Weekly progress report toggle */
  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;

  /** Quiet hours start time (HH:mm format) */
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursStart must be in HH:mm format',
  })
  quietHoursStart?: string;

  /** Quiet hours end time (HH:mm format) */
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'quietHoursEnd must be in HH:mm format',
  })
  quietHoursEnd?: string;
}
