import { Module } from '@nestjs/common';
import { SchoolBillingController } from './school-billing.controller';
import { SchoolBillingService } from './school-billing.service';
import { SchoolsModule } from '../schools/schools.module';

/**
 * School billing module — per-seat B2B subscriptions.
 * Imports SchoolsModule for SchoolsRepository; StripeModule is global.
 */
@Module({
  imports: [SchoolsModule],
  controllers: [SchoolBillingController],
  providers: [SchoolBillingService],
  exports: [SchoolBillingService],
})
export class SchoolBillingModule {}
