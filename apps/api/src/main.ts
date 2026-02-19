import * as Sentry from '@sentry/nestjs';

// Initialise Sentry before any other imports so it can instrument the full request lifecycle.
// Only initialised when SENTRY_DSN is present — safe to omit in local dev.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}

import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './infrastructure/logger/logger.service';

/**
 * Bootstrap the NestJS application with Fastify adapter.
 * Configures: global prefix, validation pipe, exception filter,
 * CORS, and Fastify-specific settings.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }), // Pino logger handles logging
    { bufferLogs: true },
  );

  const config = app.get(ConfigService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  const port = config.get<number>('PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const allowedOrigins = config
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  // ── Global API prefix (/api/v1/...) ────────────────────────────
  // Health endpoint is excluded — it must remain at /health for Railway
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // ── URI versioning (future-proofing) ───────────────────────────
  app.enableVersioning({ type: VersioningType.URI });

  // ── CORS ───────────────────────────────────────────────────────
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global validation pipe ─────────────────────────────────────
  // Validates all incoming DTOs decorated with class-validator.
  // whitelist: strips unknown properties (security hardening)
  // forbidNonWhitelisted: throws on unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global exception filter ────────────────────────────────────
  // Catches ALL unhandled exceptions and formats them as ApiError
  const exceptionsFilter = app.get(AllExceptionsFilter);
  app.useGlobalFilters(exceptionsFilter);

  // ── Global request/response logging interceptor ───────────────
  const loggingInterceptor = app.get(LoggingInterceptor);
  app.useGlobalInterceptors(loggingInterceptor);

  await app.listen(port, '0.0.0.0');

  logger.log(
    {
      event: 'app_started',
      port,
      nodeEnv,
      allowedOrigins,
    },
    'Bootstrap',
  );
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: failed to bootstrap application', err);
  process.exit(1);
});
