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
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
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
   * CORS — applied via onRequest hook on the raw Fastify instance.
   * Using addHook() instead of @fastify/cors plugin avoids plugin-scope issues
   * that occur when the plugin is registered after NestJS initialises its routes.
   * addHook() on the root Fastify instance applies to every route unconditionally.
   */
  const fastifyInstance = app.getHttpAdapter().getInstance() as FastifyInstance;
  const corsOrigins: string[] = [
    'http://localhost:3010',
    'http://localhost:3000',
    process.env['FRONTEND_URL'] ?? 'http://localhost:3010',
  ];

  fastifyInstance.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers['origin'];
    if (origin && corsOrigins.includes(origin)) {
      /**
       * Use reply.raw.setHeader() instead of reply.header() so that CORS headers
       * are written directly onto the Node.js ServerResponse object.
       * When SSE controllers call reply.raw.writeHead(), Node.js merges any previously
       * set setHeader() values with the writeHead() headers — so CORS headers survive
       * the streaming response. reply.header() stores in Fastify's internal layer
       * which is bypassed when writeHead() is called directly.
       */
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    reply.raw.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    reply.raw.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });

  const port = process.env['PORT'] ?? 3011;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
