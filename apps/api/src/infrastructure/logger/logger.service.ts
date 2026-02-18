import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import pino, { type Logger } from 'pino';

/**
 * Pino-based structured logger service.
 * Use this instead of console.log or NestJS's default logger.
 * Rule 9: No console.log in production code.
 *
 * @example
 * constructor(private readonly logger: LoggerService) {}
 * this.logger.log({ event: 'user_login', userId });
 */
@Injectable({ scope: Scope.DEFAULT })
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
      transport:
        process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      // Never log sensitive fields
      redact: {
        paths: ['password', 'token', 'idToken', 'ANTHROPIC_API_KEY', 'privateKey'],
        censor: '[REDACTED]',
      },
    });
  }

  /**
   * Log an informational message or structured object.
   * @param message - String message or structured data object
   * @param context - Optional caller context (e.g. class name)
   */
  log(message: string | Record<string, unknown>, context?: string): void {
    if (typeof message === 'string') {
      this.logger.info({ context }, message);
    } else {
      this.logger.info({ ...message, context });
    }
  }

  /**
   * Log an error with optional stack trace.
   * @param message - Error message or structured data
   * @param trace - Optional stack trace string
   * @param context - Optional caller context
   */
  error(message: string | Record<string, unknown>, trace?: string, context?: string): void {
    if (typeof message === 'string') {
      this.logger.error({ context, trace }, message);
    } else {
      this.logger.error({ ...message, context, trace });
    }
  }

  /**
   * Log a warning.
   * @param message - Warning message or structured data
   * @param context - Optional caller context
   */
  warn(message: string | Record<string, unknown>, context?: string): void {
    if (typeof message === 'string') {
      this.logger.warn({ context }, message);
    } else {
      this.logger.warn({ ...message, context });
    }
  }

  /**
   * Log a debug message (suppressed in production).
   * @param message - Debug message or structured data
   * @param context - Optional caller context
   */
  debug(message: string | Record<string, unknown>, context?: string): void {
    if (typeof message === 'string') {
      this.logger.debug({ context }, message);
    } else {
      this.logger.debug({ ...message, context });
    }
  }

  /**
   * Log a verbose message (suppressed in production).
   * @param message - Verbose message or structured data
   * @param context - Optional caller context
   */
  verbose(message: string | Record<string, unknown>, context?: string): void {
    if (typeof message === 'string') {
      this.logger.trace({ context }, message);
    } else {
      this.logger.trace({ ...message, context });
    }
  }
}
