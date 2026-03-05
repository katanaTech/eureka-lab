import { ValidationPipe as NestValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Custom validation pipe that formats errors to match our API contract.
 * CLAUDE.md Rule 10: All API endpoints must have input validation via class-validator DTOs.
 */
export const validationPipe = new NestValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors: ValidationError[]) => {
    const formattedErrors = errors.map((error) => ({
      field: error.property,
      message: error.constraints ? Object.values(error.constraints).join(', ') : 'Invalid value',
    }));

    return new BadRequestException({
      message: 'Validation failed',
      errors: formattedErrors,
    });
  },
});
