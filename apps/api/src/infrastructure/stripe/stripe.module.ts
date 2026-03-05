import { Module, Global } from '@nestjs/common';
import { StripeService } from './stripe.service';

/**
 * Global Stripe module — provides Stripe SDK abstraction layer.
 * Registered globally so all modules can inject StripeService.
 * CLAUDE.md Rule 18: All third-party SDK integrations go through an abstraction layer.
 */
@Global()
@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
