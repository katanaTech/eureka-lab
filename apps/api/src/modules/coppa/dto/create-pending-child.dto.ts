import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';

/**
 * Request body for POST /coppa/pending-child.
 * Under-13 signup — creates a pending account that needs parent confirmation
 * before a real Firebase user is created.
 *
 * NOTE: no password is collected here. Persisting an under-13's credential
 * at rest (even hashed) is an unnecessary secret. At parent-confirmation
 * time the backend creates the account with a random password and emails a
 * password-setup link, so the kid chooses their real password AFTER the
 * grown-up has confirmed.
 */
export class CreatePendingChildDto {
  /** Kid's email address (will become the child account email after confirmation) */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Parent's email — receives the confirmation link */
  @IsEmail()
  @IsNotEmpty()
  parentEmail!: string;

  /** Kid's display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Kid's birth year — server confirms age < 13 */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
