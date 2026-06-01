import { IsString, IsNotEmpty, IsInt, IsBoolean, MinLength, MaxLength, Min, Max, Matches } from 'class-validator';

/** Request body for POST /schools/:id/students (school_admin/super_admin). */
export class CreateStudentDto {
  /** Student display name */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;

  /** Per-school username — lowercase letters/digits, 3–20 chars (email local-part safe) */
  @IsString()
  @Matches(/^[a-z0-9]{3,20}$/, {
    message: 'Username must be 3–20 lowercase letters or digits',
  })
  username!: string;

  /** Initial password — min 8, no complexity requirement (kid-friendly) */
  @IsString()
  @MinLength(8)
  password!: string;

  /** 4-digit year of birth (drives the under-13 consent gate) */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;

  /** True when the admin attests school consent (required only for under-13) */
  @IsBoolean()
  consentAttested!: boolean;
}
