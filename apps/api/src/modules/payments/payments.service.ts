import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PlanType, SubscriptionData } from '@eureka-lab/shared-types';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { UsersRepository } from '../users/users.repository';

/** Price ID map populated from environment variables */
interface PriceIdMap {
  explorer: string;
  creator: string;
}

/**
 * Payments service — handles Stripe Checkout, Customer Portal, and webhook processing.
 * Orchestrates between StripeService (SDK abstraction) and UsersRepository (Firestore).
 *
 * Flow:
 * 1. Parent clicks "Upgrade" → createCheckoutSession() → redirect to Stripe
 * 2. Stripe webhook fires → handleWebhookEvent() → update user plan in Firestore
 * 3. Parent clicks "Manage" → createPortalSession() → redirect to Stripe Portal
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly priceIds: PriceIdMap;
  private readonly frontendUrl: string;

  constructor(
    private readonly stripeService: StripeService,
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {
    this.priceIds = {
      explorer: this.configService.get<string>('STRIPE_PRICE_ID_EXPLORER') ?? '',
      creator: this.configService.get<string>('STRIPE_PRICE_ID_CREATOR') ?? '',
    };
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3010';
  }

  /**
   * Create a Stripe Checkout session for a subscription upgrade.
   * Creates a Stripe customer if the user doesn't have one yet.
   *
   * @param userId - Firebase UID of the parent
   * @param plan - Target plan ('explorer' or 'creator')
   * @returns Checkout session ID and URL for redirect
   */
  async createCheckoutSession(
    userId: string,
    plan: 'explorer' | 'creator',
  ): Promise<{ sessionId: string; url: string }> {
    const user = await this.usersRepository.findByUid(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'parent') {
      throw new BadRequestException('Only parents can manage subscriptions');
    }

    const priceId = this.priceIds[plan];
    if (!priceId) {
      throw new BadRequestException(`Price ID not configured for plan: ${plan}`);
    }

    /* Create or retrieve Stripe customer */
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.displayName,
        { userId, role: user.role },
      );
      customerId = customer.id;

      /* Store customer ID on user doc for future use */
      const partialSub: SubscriptionData = {
        stripeCustomerId: customerId,
        stripeSubscriptionId: '',
        status: 'incomplete',
        currentPeriodEnd: 0,
        cancelAtPeriodEnd: false,
      };
      await this.usersRepository.updateSubscription(userId, user.plan, partialSub);
    }

    const session = await this.stripeService.createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${this.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${this.frontendUrl}/checkout/cancel`,
      metadata: { userId, plan },
    });

    this.logger.log({
      event: 'checkout_session_created',
      userId,
      plan,
      sessionId: session.sessionId,
    });

    return session;
  }

  /**
   * Create a Stripe Customer Portal session for subscription management.
   *
   * @param userId - Firebase UID of the parent
   * @param returnUrl - URL to redirect back to after portal interaction
   * @returns Portal session URL
   */
  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const user = await this.usersRepository.findByUid(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      throw new BadRequestException('No active subscription found');
    }

    const portal = await this.stripeService.createPortalSession(customerId, returnUrl);

    this.logger.log({
      event: 'portal_session_created',
      userId,
      customerId,
    });

    return portal;
  }

  /**
   * Handle a verified Stripe webhook event.
   * Updates user plan and subscription data based on event type.
   *
   * @param eventType - Stripe event type string
   * @param data - Event data object
   */
  async handleWebhookEvent(
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    switch (eventType) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(data);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(data);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(data);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(data);
        break;
      default:
        this.logger.log({ event: 'webhook_ignored', eventType });
    }
  }

  /**
   * Handle checkout.session.completed — activate subscription.
   * @param data - Checkout session data
   */
  private async handleCheckoutCompleted(data: Record<string, unknown>): Promise<void> {
    const metadata = data['metadata'] as Record<string, string> | undefined;
    const subscriptionId = data['subscription'] as string | undefined;
    const customerId = data['customer'] as string | undefined;

    if (!metadata?.['userId'] || !metadata?.['plan'] || !subscriptionId || !customerId) {
      this.logger.warn({ event: 'checkout_completed_missing_data', data });
      return;
    }

    const userId = metadata['userId'];
    const plan = metadata['plan'] as PlanType;

    /* Estimate period end — billing_cycle_anchor + ~30 days for monthly subscriptions */
    const subscription = await this.stripeService.getSubscription(subscriptionId);
    const currentPeriodEnd = subscription
      ? subscription.billing_cycle_anchor + 30 * 24 * 60 * 60
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const subscriptionData: SubscriptionData = {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    };

    await this.usersRepository.updateSubscription(userId, plan, subscriptionData);

    this.logger.log({
      event: 'subscription_activated',
      userId,
      plan,
      subscriptionId,
    });
  }

  /**
   * Handle customer.subscription.updated — sync status changes.
   * @param data - Subscription data
   */
  private async handleSubscriptionUpdated(data: Record<string, unknown>): Promise<void> {
    const subscriptionId = data['id'] as string | undefined;
    if (!subscriptionId) return;

    const user = await this.usersRepository.findByStripeSubscriptionId(subscriptionId);
    if (!user) {
      this.logger.warn({ event: 'subscription_updated_user_not_found', subscriptionId });
      return;
    }

    const status = data['status'] as string;
    const cancelAtPeriodEnd = data['cancel_at_period_end'] as boolean;
    const currentPeriodEnd = data['current_period_end'] as number;

    const subscriptionData: SubscriptionData = {
      stripeCustomerId: user.subscription?.stripeCustomerId ?? '',
      stripeSubscriptionId: subscriptionId,
      status: status as SubscriptionData['status'],
      currentPeriodEnd: currentPeriodEnd ?? user.subscription?.currentPeriodEnd ?? 0,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
    };

    await this.usersRepository.updateSubscription(user.uid, user.plan, subscriptionData);

    this.logger.log({
      event: 'subscription_updated',
      userId: user.uid,
      status,
      cancelAtPeriodEnd,
    });
  }

  /**
   * Handle customer.subscription.deleted — downgrade to free.
   * @param data - Subscription data
   */
  private async handleSubscriptionDeleted(data: Record<string, unknown>): Promise<void> {
    const subscriptionId = data['id'] as string | undefined;
    if (!subscriptionId) return;

    const user = await this.usersRepository.findByStripeSubscriptionId(subscriptionId);
    if (!user) {
      this.logger.warn({ event: 'subscription_deleted_user_not_found', subscriptionId });
      return;
    }

    await this.usersRepository.clearSubscription(user.uid);

    this.logger.log({
      event: 'subscription_deleted',
      userId: user.uid,
      subscriptionId,
    });
  }

  /**
   * Handle invoice.payment_failed — mark subscription as past_due.
   * @param data - Invoice data
   */
  private async handlePaymentFailed(data: Record<string, unknown>): Promise<void> {
    const customerId = data['customer'] as string | undefined;
    if (!customerId) return;

    const user = await this.usersRepository.findByStripeCustomerId(customerId);
    if (!user || !user.subscription) {
      this.logger.warn({ event: 'payment_failed_user_not_found', customerId });
      return;
    }

    const subscriptionData: SubscriptionData = {
      ...user.subscription,
      status: 'past_due',
    };

    await this.usersRepository.updateSubscription(user.uid, user.plan, subscriptionData);

    this.logger.warn({
      event: 'payment_failed',
      userId: user.uid,
      customerId,
    });
  }
}
