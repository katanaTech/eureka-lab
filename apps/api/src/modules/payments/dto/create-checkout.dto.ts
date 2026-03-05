import { IsIn, IsString } from 'class-validator';

/**
 * DTO for creating a Stripe Checkout session.
 * Only paid plan types are accepted (no 'free').
 */
export class CreateCheckoutDto {
  /** Target plan to subscribe to */
  @IsString()
  @IsIn(['explorer', 'creator'], { message: 'Plan must be either "explorer" or "creator"' })
  plan!: 'explorer' | 'creator';
}
