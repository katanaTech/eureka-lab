import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SchoolBillingModule } from '../school-billing/school-billing.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

/**
 * Payments module — Stripe Checkout, Customer Portal, and webhook handling.
 * Imports UsersModule for subscription data persistence.
 * Imports SchoolBillingModule to dispatch school billing webhook events.
 * StripeModule is global and auto-injected.
 */
@Module({
  imports: [UsersModule, SchoolBillingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
