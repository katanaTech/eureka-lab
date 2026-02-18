import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';

/**
 * Application-wide configuration module.
 * Validates all environment variables at startup via Joi.
 * If any required variable is missing, the app fails to start.
 *
 * Inject ConfigService to read env vars in other services:
 * @example
 * constructor(private readonly config: ConfigService) {}
 * const key = this.config.get<string>('ANTHROPIC_API_KEY');
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: false,
      },
    }),
  ],
})
export class ConfigModule {}
