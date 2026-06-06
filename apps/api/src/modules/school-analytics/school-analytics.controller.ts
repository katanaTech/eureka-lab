import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type {
  PlatformUsageOverview,
  SchoolUsageRow,
} from '@eureka-lab/shared-types';
import { SchoolAnalyticsService } from './school-analytics.service';

/**
 * Super-admin usage analytics (read-only). Platform overview + per-school rows.
 */
@Controller('school-analytics')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('super_admin')
export class SchoolAnalyticsController {
  constructor(private readonly analytics: SchoolAnalyticsService) {}

  /**
   * Platform-wide usage aggregate.
   * @returns The overview tiles payload.
   */
  @Get('overview')
  async overview(): Promise<PlatformUsageOverview> {
    return this.analytics.getOverview();
  }

  /**
   * Per-school usage rows for the enriched table.
   * @returns Rows wrapped in { schools }.
   */
  @Get('schools')
  async schools(): Promise<{ schools: SchoolUsageRow[] }> {
    return { schools: await this.analytics.getSchoolRows() };
  }
}
