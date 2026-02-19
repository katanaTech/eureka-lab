import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { HealthModule } from './modules/health/health.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Root application module.
 *
 * Module loading order:
 * 1. ConfigModule — validates env vars; must be first
 * 2. LoggerModule — global Pino logger; available everywhere
 * 3. FirebaseModule — global Firebase Admin SDK; available everywhere
 * 4. ThrottlerModule — rate limiting (devops-rules.md §9)
 * 5. Feature modules (Health, Auth, Users, etc.)
 *
 * Modules added as sprints progress:
 * - AuthModule (BE-010)
 * - UsersModule (BE-015)
 * - AiGatewayModule (BE-020)
 */
@Module({
  imports: [
    // Infrastructure
    ConfigModule,
    LoggerModule,
    FirebaseModule,

    // Rate limiting — short: 10 req/s, medium: 100 req/min (devops-rules.md §9)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60_000,
        limit: 100,
      },
    ]),

    // Feature modules
    HealthModule,
  ],
  // Provided here so app.get() can retrieve them for global registration in main.ts
  providers: [AllExceptionsFilter, LoggingInterceptor],
})
export class AppModule {}
