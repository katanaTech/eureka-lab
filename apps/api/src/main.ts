import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

/**
 * Pre-load .env before anything else — monorepo-safe paths.
 * dotenv v17 no longer auto-injects into process.env,
 * so we manually assign parsed values.
 */
const envPaths = [
  resolve(__dirname, '..', '.env'),
  resolve(process.cwd(), '.env'),
];
for (const envPath of envPaths) {
  const result = dotenvConfig({ path: envPath });
  if (result.parsed) {
    for (const [key, value] of Object.entries(result.parsed)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationPipe } from './common/pipes/validation.pipe';

/**
 * Bootstrap the NestJS application with Fastify adapter.
 * Registers global pipes, filters, Pino logger, and CORS.
 * Listens on port 3011 by default, configurable via PORT env var.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true, rawBody: true },
  );

  app.useLogger(app.get(Logger));
  app.useGlobalPipes(validationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api/v1');

  /**
   * CORS — register @fastify/cors directly on the raw Fastify instance.
   * NestJS enableCors() can fail silently with Fastify version mismatches,
   * so we bypass it and register on the underlying Fastify server.
   */
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fastifyInstance = app.getHttpAdapter().getInstance();
  await fastifyInstance.register(require('@fastify/cors'), {
    origin: [
      'http://localhost:3010',
      'http://localhost:3000',
      process.env['FRONTEND_URL'] ?? 'http://localhost:3010',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3011;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
