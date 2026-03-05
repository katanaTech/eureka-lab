import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

/**
 * Payments module — Stripe Checkout, Customer Portal, and webhook handling.
 * Imports UsersModule for subscription data persistence.
 * StripeModule is global and auto-injected.
 */
@Module({
  imports: [UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
