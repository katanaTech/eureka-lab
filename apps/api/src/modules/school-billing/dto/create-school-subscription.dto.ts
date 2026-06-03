import { IsEmail, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Request body for super-admin subscription setup (POST /school-billing/:schoolId/subscription). */
export class CreateSchoolSubscriptionDto {
  /** Email Stripe sends invoices / portal links to. */
  @IsEmail()
  billingEmail!: string;

  /** Optional trial length in days (0–90). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  trialDays?: number;
}
