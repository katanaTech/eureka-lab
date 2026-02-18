import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { type Observable, tap } from 'rxjs';
import { LoggerService } from '../../infrastructure/logger/logger.service';

/**
 * Request/response logging interceptor.
 * Logs every HTTP request with method, path, status code, and latency.
 * Uses structured logging — no console.log (Rule 9).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<{ statusCode: number }>();
        const latencyMs = Date.now() - startTime;

        this.logger.log(
          {
            event: 'http_request',
            method,
            url,
            statusCode: response.statusCode,
            latencyMs,
          },
          LoggingInterceptor.name,
        );
      }),
    );
  }
}
