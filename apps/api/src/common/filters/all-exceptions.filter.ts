import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { LoggerService } from '../../infrastructure/logger/logger.service';

/**
 * Shape of all error responses (matches api-contracts.md error format).
 */
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp: string;
}

/**
 * Global exception filter — catches ALL unhandled exceptions.
 *
 * Rules enforced:
 * - Never exposes stack traces in production (CLAUDE.md Rule 4 / security)
 * - Logs every error via Pino (Rule 9: no console.log)
 * - Returns the standard ApiError shape from api-contracts.md
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let code: string | undefined;
    let errors: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body['message'] as string) ?? message;
        code = body['code'] as string | undefined;
        errors = body['errors'] as typeof errors;
      }

      error = HttpStatus[statusCode] ?? 'Error';
    }

    const isProduction = process.env['NODE_ENV'] === 'production';

    this.logger.error(
      {
        event: 'http_error',
        statusCode,
        method: request.method,
        url: request.url,
        // Never log stack in production
        ...(isProduction ? {} : { stack: exception instanceof Error ? exception.stack : undefined }),
      },
      message,
      AllExceptionsFilter.name,
    );

    const responseBody: ErrorResponse = {
      statusCode,
      error,
      message,
      ...(code ? { code } : {}),
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
    };

    void reply.status(statusCode).send(responseBody);
  }
}
