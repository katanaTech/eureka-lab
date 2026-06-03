import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { SchoolBillingSummary } from '@eureka-lab/shared-types';
import { SchoolBillingService } from './school-billing.service';
import { CreateSchoolSubscriptionDto } from './dto/create-school-subscription.dto';
import { PortalSessionDto } from '../payments/dto/portal-session.dto';

/**
 * B2B school billing endpoints. Super-admin sets up + reads any school's
 * billing; school_admin reads/manages only their own school (schoolId from
 * the verified token claim — no :id to spoof, so TenantGuard is not needed).
 */
@Controller('school-billing')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class SchoolBillingController {
  constructor(private readonly billing: SchoolBillingService) {}

  /**
   * Customer Portal link for the caller's own school.
   * @param user - Authenticated school_admin (schoolId from claim).
   * @param dto - Return URL.
   * @returns The portal URL.
   */
  @Post('portal')
  @Roles('school_admin')
  @HttpCode(HttpStatus.OK)
  async portal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PortalSessionDto,
  ): Promise<{ url: string }> {
    return this.billing.createPortalLink(this.requireSchoolId(user), dto.returnUrl);
  }

  /**
   * Billing summary for the caller's own school (badge).
   * @param user - Authenticated school_admin (schoolId from claim).
   * @returns Billing summary.
   */
  @Get('me')
  @Roles('school_admin')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<SchoolBillingSummary> {
    return this.billing.getOwnBillingSummary(this.requireSchoolId(user));
  }

  /**
   * Set up a subscription for a school (super_admin).
   * @param schoolId - Target school id.
   * @param dto - billingEmail + optional trialDays.
   * @returns Billing summary incl. invoice URL.
   */
  @Post(':schoolId/subscription')
  @Roles('super_admin')
  @HttpCode(HttpStatus.CREATED)
  async setUp(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateSchoolSubscriptionDto,
  ): Promise<SchoolBillingSummary> {
    return this.billing.setUpSubscription(schoolId, dto);
  }

  /**
   * Billing summary for any school (super_admin).
   * @param schoolId - School id.
   * @returns Billing summary.
   */
  @Get(':schoolId')
  @Roles('super_admin')
  async get(@Param('schoolId') schoolId: string): Promise<SchoolBillingSummary> {
    return this.billing.getBillingSummary(schoolId);
  }

  /**
   * Resolve the caller's schoolId claim or reject.
   * @param user - Authenticated user.
   * @returns The schoolId.
   * @throws ForbiddenException when the claim is absent.
   */
  private requireSchoolId(user: AuthenticatedUser): string {
    if (!user.schoolId) {
      throw new ForbiddenException({ message: 'No school claim', code: 'NO_SCHOOL_CLAIM' });
    }
    return user.schoolId;
  }
}
