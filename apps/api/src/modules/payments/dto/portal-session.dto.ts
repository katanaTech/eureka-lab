import { IsString, IsUrl } from 'class-validator';

/**
 * DTO for creating a Stripe Customer Portal session.
 */
export class PortalSessionDto {
  /** URL to redirect back to after the portal interaction */
  @IsString()
  @IsUrl({}, { message: 'returnUrl must be a valid URL' })
  returnUrl!: string;
}
