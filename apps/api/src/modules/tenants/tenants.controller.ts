import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { TenantUiModeLock } from '@eureka-lab/shared-types';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantsService } from './tenants.service';
import { UpdateUiModeLockDto } from './dto/update-ui-mode-lock.dto';

/**
 * Tenants controller — manages tenant-level configuration for B2B education clients.
 * Restricted to admin and teacher roles only.
 */
@Controller('tenants')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Get the UI mode lock setting for a specific tenant.
   * Returns 404 if no lock has been configured for this tenant.
   * @param tenantId - Tenant document ID from the URL
   * @returns The tenant's TenantUiModeLock configuration
   */
  @Get(':tenantId/ui-mode-lock')
  @HttpCode(HttpStatus.OK)
  async getUiModeLock(@Param('tenantId') tenantId: string): Promise<TenantUiModeLock> {
    const lock = await this.tenantsService.getUiModeLock(tenantId);
    if (lock === null) {
      throw new NotFoundException(`No UI mode lock found for tenant '${tenantId}'.`);
    }
    return lock;
  }

  /**
   * Create or update the UI mode lock for a specific tenant.
   * When locked is true and mode is non-null, all tenant users are forced into that mode.
   * @param tenantId - Tenant document ID from the URL
   * @param dto - Lock configuration to apply
   * @returns The saved TenantUiModeLock configuration
   */
  @Put(':tenantId/ui-mode-lock')
  @HttpCode(HttpStatus.OK)
  async setUiModeLock(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateUiModeLockDto,
  ): Promise<TenantUiModeLock> {
    const lock: TenantUiModeLock = {
      mode: dto.mode ?? null,
      locked: dto.locked,
    };
    await this.tenantsService.setUiModeLock(tenantId, lock);
    return lock;
  }
}
