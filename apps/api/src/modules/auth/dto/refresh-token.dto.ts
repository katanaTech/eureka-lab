import { IsString, IsNotEmpty } from 'class-validator';

/** Request body for POST /auth/refresh */
export class RefreshTokenDto {
  /** Firebase refresh token */
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
