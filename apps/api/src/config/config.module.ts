import { resolve, join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';

/**
 * Application configuration module.
 * Validates environment variables at startup using Joi schema.
 * Loads .env from apps/api/ regardless of cwd (monorepo-safe).
 *
 * envFilePath order:
 *  1. Relative to compiled dist/ (dist/config → ../../.env = apps/api/.env)
 *  2. Relative to cwd (for when cwd IS apps/api)
 *  3. Monorepo-root relative (cwd/apps/api/.env)
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '..', '..', '.env'),
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), 'apps', 'api', '.env'),
      ],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
  ],
})
export class ConfigModule {}
