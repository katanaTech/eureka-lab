import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Guard that enforces single-tenant access on routes scoped by an `:id`
 * school parameter. A `super_admin` bypasses the check; any other caller must
 * carry a `schoolId` claim matching the route's `:id`.
 *
 * Must run AFTER FirebaseAuthGuard so `request.user` is populated.
 * Shared infrastructure — first applied to live routes in epic sub-projects 2–3.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  /**
   * @param context - Execution context.
   * @returns True when access is permitted.
   * @throws ForbiddenException on cross-tenant access.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = (request as FastifyRequest & { user: AuthenticatedUser }).user;
    const params = (request as FastifyRequest & { params?: Record<string, string> }).params ?? {};
    const targetSchoolId = params.id;

    if (user?.role === 'super_admin') {
      return true;
    }

    if (!user?.schoolId || user.schoolId !== targetSchoolId) {
      throw new ForbiddenException({
        message: 'Cross-tenant access denied',
        code: 'TENANT_MISMATCH',
      });
    }

    return true;
  }
}
