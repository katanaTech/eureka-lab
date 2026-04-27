import { Injectable } from '@nestjs/common';
import type { UiMode } from '@eureka-lab/shared-types';
import { UsersRepository } from '../users/users.repository';
import { TenantsService } from './tenants.service';

/**
 * Resolves the effective UI mode for a user applying the following precedence:
 *   1. Tenant lock (if tenantId is provided, locked is true, and mode is non-null)
 *   2. User's personal preference
 *   3. Default fallback: 'normal'
 *
 * See docs/context/ADR-004 for the full decision record.
 */
@Injectable()
export class UiModeResolver {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  /**
   * Resolve the effective UI mode for a user.
   * Precedence: tenant lock > user preference > default ('normal').
   *
   * @param userId - Firebase UID
   * @param tenantId - Tenant ID (null for B2C users)
   * @returns The effective UiMode
   */
  async resolve(userId: string, tenantId: string | null): Promise<UiMode> {
    if (tenantId !== null) {
      const lock = await this.tenantsService.getUiModeLock(tenantId);
      if (lock !== null && lock.locked && lock.mode !== null) {
        return lock.mode;
      }
    }

    const userMode = await this.usersRepository.getUiMode(userId);
    if (userMode !== null) {
      return userMode;
    }

    return 'normal';
  }
}
