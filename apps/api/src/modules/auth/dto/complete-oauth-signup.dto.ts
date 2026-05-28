import { IsInt, Min, Max } from 'class-validator';

/**
 * Request body for POST /auth/complete-oauth-signup.
 *
 * After a Google OAuth signInWithPopup the client has a valid Firebase
 * session (auth.currentUser is set) but no Firestore profile yet. This
 * endpoint creates the profile using the same role-derivation rules as
 * the standard /auth/signup endpoint (Plan 3b A.2).
 *
 * The Firebase ID token is verified by the FirebaseAuthGuard on the
 * controller; the caller's UID is taken from the verified token, not
 * from the request body.
 */
export class CompleteOAuthSignupDto {
  /** 4-digit year of birth — must satisfy the same age rules as SignupDto. */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
