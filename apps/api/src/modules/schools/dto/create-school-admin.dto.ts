import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/** Request body for POST /schools/:id/admins (super_admin only). */
export class CreateSchoolAdminDto {
  /** Admin email */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Admin display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Initial password — min 8 chars, ≥1 uppercase + ≥1 number (mirrors SignupDto) */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;
}
