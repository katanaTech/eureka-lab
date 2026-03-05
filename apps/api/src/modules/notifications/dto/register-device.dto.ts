/**
 * DTO for registering a push notification device/subscription.
 * CLAUDE.md Rule 10: All API endpoints must have input validation.
 *
 * @module register-device.dto
 */

import { IsString, IsNotEmpty, IsObject, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Push subscription keys DTO */
export class PushKeysDto {
  /** Web Push p256dh public key */
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  /** Web Push authentication secret */
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

/** Request body for POST /notifications/register */
export class RegisterDeviceDto {
  /** Web Push endpoint URL */
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  /** Web Push encryption keys */
  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;

  /** Device platform */
  @IsString()
  @IsIn(['web', 'android', 'ios'])
  platform!: string;
}
