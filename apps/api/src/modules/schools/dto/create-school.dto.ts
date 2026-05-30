import { IsString, IsNotEmpty, MinLength, MaxLength, IsInt, Min, Max, IsOptional } from 'class-validator';

/** Request body for POST /schools (super_admin only). */
export class CreateSchoolDto {
  /** School display name (moderated on create) */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  /** Number of student licenses (seats) */
  @IsInt()
  @Min(0)
  @Max(100000)
  seatLimit!: number;

  /** Optional subscription tier label; defaults to 'trial' server-side */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  subscriptionTier?: string;
}
