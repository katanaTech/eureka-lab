import { IsString, IsNotEmpty } from 'class-validator';

/** Request body for POST /auth/login */
export class LoginDto {
  /** Firebase ID token obtained from the Firebase Auth SDK after sign-in */
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
