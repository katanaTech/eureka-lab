import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

/**
 * Authenticated user payload attached by FirebaseAuthGuard.
 */
export interface AuthenticatedUser {
  /** Firebase UID */
  uid: string;
  /** Email address */
  email: string;
  /** User role from custom claims */
  role: string;
}

/**
 * Parameter decorator to extract the authenticated user from the request.
 * Must be used on endpoints protected by FirebaseAuthGuard.
 *
 * @example
 * ```ts
 * @Get('me')
 * getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return (request as FastifyRequest & { user: AuthenticatedUser }).user;
  },
);
