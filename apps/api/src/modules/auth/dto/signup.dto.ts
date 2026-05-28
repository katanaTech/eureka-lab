import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsInt, Min, Max } from 'class-validator';

/**
 * Request body for POST /auth/signup.
 *
 * Per ADR-006 and Plan 3b A.1, the client sends `birthYear` only — the
 * server computes the role:
 *   - age 13–16 → role 'child'
 *   - age 17    → rejected (`AGE_GAP` — between kid and adult tiers)
 *   - age ≥ 18  → role 'parent'
 *   - age < 13  → routed to the COPPA pipeline (Phase C; this endpoint
 *                  rejects with `UNDER_13_PIPELINE_REQUIRED` so the
 *                  frontend can prompt for `parentEmail`).
 *
 * Teachers do NOT signup via this endpoint — teachers self-onboard via a
 * separate flow that does not yet exist in UI (filed as ROADMAP Stream 4
 * gap "Teacher signup UI"). For now teachers are seeded via direct API
 * calls; when a UI is added it will hit a dedicated `/auth/signup-teacher`
 * route, not this one.
 */
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
   * 4-digit year of birth used to derive role server-side.
   * Constrained to [1900, current year] — `AuthService.signup` enforces
   * the age-specific rules listed in the class JSDoc.
   */
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  birthYear!: number;
}
