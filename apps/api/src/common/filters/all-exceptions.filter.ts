import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Global exception filter.
 * Catches all unhandled exceptions and returns the standard error format.
 * CLAUDE.md Rule 9: Logs via Pino, never console.log.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Handle caught exceptions and return standard error response.
   * @param exception - The thrown exception
   * @param host - Argument host for accessing request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | undefined;
    let errors: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res['message'] as string) ?? message;
        code = res['code'] as string | undefined;
        errors = res['errors'] as Array<{ field: string; message: string }> | undefined;
      }
    }

    const errorBody = {
      statusCode,
      error: HttpStatus[statusCode] ?? 'Unknown Error',
      message,
      ...(code && { code }),
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
    };

    this.logger.error({
      event: 'unhandled_exception',
      statusCode,
      path: request.url,
      method: request.method,
      message,
      ...(statusCode >= 500 && exception instanceof Error && { stack: exception.stack }),
    });

    response.status(statusCode).send(errorBody);
  }
}
