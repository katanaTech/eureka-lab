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

  /** Account role — 'parent' or 'teacher'. Child accounts use /auth/add-child */
  @IsIn(['parent', 'teacher'], {
    message: "Role must be 'parent' or 'teacher'",
  })
  role!: 'parent' | 'teacher';
}
