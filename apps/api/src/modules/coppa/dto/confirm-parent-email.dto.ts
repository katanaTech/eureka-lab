import { IsString, IsNotEmpty, Length } from 'class-validator';

/**
 * Request body for POST /coppa/confirm-parent-email.
 * The `token` is the one delivered in the parent's confirmation email
 * (per CoppaService — 32-char URL-safe random string).
 */
export class ConfirmParentEmailDto {
  @IsString()
  @IsNotEmpty()
  @Length(32, 32)
  token!: string;
}
