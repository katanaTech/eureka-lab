import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsIn } from 'class-validator';

/** Request body for POST /auth/signup */
export class SignupDto {
  /** Account email address */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Password — min 8 chars, at least 1 uppercase and 1 number */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;

  /** Display name for the account */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /**
   * Account role — 'parent', 'teacher', or 'child'.
   *
   * Per ADR-006 (kid signup flow), 'child' is now also accepted via
   * /auth/signup so Welcome's "Begin Quest" tab (ages 13–16) can self-onboard.
   * The /auth/add-child path remains for parent-driven account creation.
   *
   * Known gap (Plan 3 P3-14): the role is currently client-trusted. The Plan 3
   * COPPA work will move role derivation server-side from a `birthYear` field.
   */
  @IsIn(['parent', 'teacher', 'child'], {
    message: "Role must be 'parent', 'teacher', or 'child'",
  })
  role!: 'parent' | 'teacher' | 'child';
}
