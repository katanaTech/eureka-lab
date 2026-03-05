import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that enforces role-based access control.
 * Must be used AFTER FirebaseAuthGuard so that request.user is populated.
 *
 * @example
 * ```ts
 * @Roles('parent')
 * @UseGuards(FirebaseAuthGuard, RolesGuard)
 * addChild() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Check if the authenticated user has one of the required roles.
   * @param context - Execution context
   * @returns True if user role matches
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as FastifyRequest & { user: AuthenticatedUser }).user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        message: `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
        code: 'ROLE_REQUIRED',
      });
    }

    return true;
  }
}
