import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CoppaService } from './coppa.service';
import { CreatePendingChildDto } from './dto/create-pending-child.dto';
import { ConfirmParentEmailDto } from './dto/confirm-parent-email.dto';

/**
 * COPPA pipeline endpoints. Public — no auth required because the kid
 * doesn't have a real account yet at create time, and the parent doesn't
 * have an Eureka Lab account at confirm time.
 *
 * Both endpoints are rate-limited at the global Nest layer (or should
 * be — verify in main.ts that throttling is enabled before shipping).
 */
@Controller('coppa')
export class CoppaController {
  constructor(private readonly coppa: CoppaService) {}

  /**
   * Create a pending child account. Sends parent an email with a
   * confirmation link.
   */
  @Post('pending-child')
  @HttpCode(HttpStatus.ACCEPTED)
  async createPendingChild(@Body() dto: CreatePendingChildDto) {
    return this.coppa.createPendingChild(dto);
  }

  /**
   * Confirm a pending child account using the token from the parent's
   * email. Creates the real Firebase user + Firestore profile.
   */
  @Post('confirm-parent-email')
  @HttpCode(HttpStatus.CREATED)
  async confirmParentEmail(@Body() dto: ConfirmParentEmailDto) {
    return this.coppa.confirmParentEmail(dto);
  }
}
