import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/** Request body for POST /schools/:id/teachers (school_admin/super_admin). */
export class CreateTeacherDto {
  /** Teacher email */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Teacher display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Initial password — min 8 chars, ≥1 uppercase + ≥1 number */
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password!: string;
}
