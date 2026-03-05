import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PortalSessionDto } from './dto/portal-session.dto';

/**
 * Payments controller — Stripe Checkout, Customer Portal, and webhooks.
 *
 * Endpoints:
 * - POST /payments/checkout  — create a Checkout session (parents only)
 * - POST /payments/portal    — create a Portal session (parents only)
 * - POST /payments/webhook   — handle Stripe webhook events (public)
 */
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Create a Stripe Checkout session for subscription upgrade.
   * Only parents can create checkout sessions.
   *
   * @param dto - Checkout creation data (plan type)
   * @param user - Authenticated parent user
   * @returns Session ID and redirect URL
   */
  @Post('checkout')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('parent')
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ sessionId: string; url: string }> {
    this.logger.log({
      event: 'checkout_request',
      userId: user.uid,
      plan: dto.plan,
    });

    return this.paymentsService.createCheckoutSession(user.uid, dto.plan);
  }

  /**
   * Create a Stripe Customer Portal session for subscription management.
   * Only parents can access the portal.
   *
   * @param dto - Portal session data (return URL)
   * @param user - Authenticated parent user
   * @returns Portal redirect URL
   */
  @Post('portal')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('parent')
  @HttpCode(HttpStatus.OK)
  async createPortal(
    @Body() dto: PortalSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    this.logger.log({
      event: 'portal_request',
      userId: user.uid,
    });

    return this.paymentsService.createPortalSession(user.uid, dto.returnUrl);
  }

  /**
   * Handle Stripe webhook events.
   * This endpoint is PUBLIC — no auth guard. Signature verification replaces auth.
   * Stripe sends events for checkout completion, subscription changes, payment failures.
   *
   * @param req - Raw Fastify request (needs raw body for signature verification)
   * @param signature - Stripe-Signature header
   * @param res - Fastify reply
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: FastifyRequest,
    @Headers('stripe-signature') signature: string | undefined,
    @Res() res: FastifyReply,
  ): Promise<void> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    /* Get raw body for signature verification */
    const rawBody = (req as FastifyRequest & { rawBody?: string }).rawBody;
    if (!rawBody) {
      this.logger.error({ event: 'webhook_no_raw_body' });
      throw new BadRequestException('Missing raw body for webhook verification');
    }

    const event = this.stripeService.constructWebhookEvent(rawBody, signature);
    if (!event) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log({
      event: 'webhook_received',
      eventType: event.type,
      eventId: event.id,
    });

    await this.paymentsService.handleWebhookEvent(
      event.type,
      event.data.object as unknown as Record<string, unknown>,
    );

    await res.status(HttpStatus.OK).send({ received: true });
  }
}
