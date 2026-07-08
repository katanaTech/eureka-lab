import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { StripeModule } from './infrastructure/stripe/stripe.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { ModulesModule } from './modules/modules/modules.module';
import { ProgressModule } from './modules/progress/progress.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CombatModule } from './modules/combat/combat.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CoppaModule } from './modules/coppa/coppa.module';
import { AcademyProgressModule } from './modules/academy-progress/academy-progress.module';
import { SchoolBillingModule } from './modules/school-billing/school-billing.module';
import { SchoolAnalyticsModule } from './modules/school-analytics/school-analytics.module';

/**
 * Root application module.
 * Registers infrastructure modules first, then feature modules.
 */
@Module({
  imports: [
    /* Infrastructure */
    ConfigModule,
    LoggerModule,
    FirebaseModule,
    StripeModule,
    /* Features */
    HealthModule,
    AuthModule,
    AiModule,
    ModulesModule,
    ProgressModule,
    GamificationModule,
    WorkflowsModule,
    ProjectsModule,
    AgentsModule,
    PaymentsModule,
    ClassroomsModule,
    SchoolsModule,
    SchoolBillingModule,
    SchoolAnalyticsModule,
    NotificationsModule,
    CombatModule,
    InventoryModule,
    CoppaModule,
    AcademyProgressModule,
  ],
})
export class AppModule {}
