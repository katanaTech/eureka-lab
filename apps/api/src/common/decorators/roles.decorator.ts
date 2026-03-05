import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access an endpoint.
 * Used with RolesGuard.
 *
 * @param roles - Allowed user roles
 *
 * @example
 * ```ts
 * @Roles('parent', 'admin')
 * @UseGuards(FirebaseAuthGuard, RolesGuard)
 * addChild() { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
