import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type {
  CheckoutSessionParams,
  SchoolSubscriptionParams,
  SchoolSubscriptionResult,
  QuantityUpdateResult,
} from './stripe.types';

/**
 * Stripe SDK abstraction layer.
 * CLAUDE.md Rule 18: All third-party SDK integrations go through an abstraction layer.
 *
 * Provides methods for:
 * - Creating Checkout sessions (hosted payment page)
 * - Creating Customer Portal sessions (self-service management)
 * - Validating webhook signatures
 * - Managing customers and subscriptions
 *
 * Falls back gracefully when STRIPE_SECRET_KEY is not set (dev mode).
 */
@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private client: Stripe | null = null;
  private webhookSecret: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the Stripe SDK on module startup.
   * Logs a warning if no API key is configured (dev mode).
   */
  onModuleInit(): void {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? null;

    if (secretKey) {
      this.client = new Stripe(secretKey);
      this.logger.log({ event: 'stripe_init', status: 'connected' });
    } else {
      this.logger.warn({
        event: 'stripe_init',
        status: 'no_api_key',
        message: 'STRIPE_SECRET_KEY not set — payment features will return mock responses',
      });
    }
  }

  /**
   * Whether the Stripe client is available (API key configured).
   * @returns true if Stripe is connected
   */
  get isConnected(): boolean {
    return this.client !== null;
  }

  /**
   * Create a new Stripe customer.
   * @param email - Customer email address
   * @param name - Customer display name
   * @param metadata - Additional metadata (userId, etc.)
   * @returns Stripe customer object or mock
   */
  async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, string>,
  ): Promise<{ id: string; email: string }> {
    if (!this.client) {
      const mockId = `cus_mock_${Date.now()}`;
      this.logger.warn({ event: 'stripe_mock', method: 'createCustomer', mockId });
      return { id: mockId, email };
    }

    const customer = await this.client.customers.create({
      email,
      name,
      metadata,
    });

    this.logger.log({ event: 'stripe_customer_created', customerId: customer.id });
    return { id: customer.id, email: customer.email ?? email };
  }

  /**
   * Create a Stripe Checkout session for subscription payment.
   * @param params - Checkout session configuration
   * @returns Session ID and URL for redirect
   */
  async createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.client) {
      const mockId = `cs_mock_${Date.now()}`;
      this.logger.warn({ event: 'stripe_mock', method: 'createCheckoutSession', mockId });
      return { sessionId: mockId, url: params.successUrl };
    }

    const session = await this.client.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: {
        metadata: params.metadata,
      },
    });

    this.logger.log({
      event: 'stripe_checkout_created',
      sessionId: session.id,
      customerId: params.customerId,
    });

    return { sessionId: session.id, url: session.url ?? params.successUrl };
  }

  /**
   * Create a Stripe Customer Portal session for self-service management.
   * @param customerId - Stripe customer ID
   * @param returnUrl - URL to return to after portal interaction
   * @returns Portal session URL
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    if (!this.client) {
      this.logger.warn({ event: 'stripe_mock', method: 'createPortalSession' });
      return { url: returnUrl };
    }

    const session = await this.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    this.logger.log({
      event: 'stripe_portal_created',
      customerId,
    });

    return { url: session.url };
  }

  /**
   * Validate and construct a Stripe webhook event from raw payload.
   * @param payload - Raw request body string
   * @param signature - Stripe-Signature header value
   * @returns Validated Stripe event or null if validation fails
   */
  constructWebhookEvent(
    payload: string,
    signature: string,
  ): Stripe.Event | null {
    if (!this.client || !this.webhookSecret) {
      this.logger.warn({ event: 'stripe_mock', method: 'constructWebhookEvent' });
      return null;
    }

    try {
      return this.client.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (err: unknown) {
      this.logger.error({
        event: 'stripe_webhook_verification_failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Retrieve a Stripe subscription by ID.
   * @param subscriptionId - Stripe subscription ID (sub_...)
   * @returns Subscription object or null
   */
  async getSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    if (!this.client) {
      this.logger.warn({ event: 'stripe_mock', method: 'getSubscription' });
      return null;
    }

    try {
      return await this.client.subscriptions.retrieve(subscriptionId);
    } catch (err: unknown) {
      this.logger.error({
        event: 'stripe_subscription_fetch_failed',
        subscriptionId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Create a per-seat school subscription billed by invoice.
   * @param params - Customer, price, quantity, invoice terms, optional trial, metadata.
   * @returns Subscription id, status, current period end, and hosted invoice URL.
   */
  async createSchoolSubscription(
    params: SchoolSubscriptionParams,
  ): Promise<SchoolSubscriptionResult> {
    if (!this.client) {
      const mockId = `sub_mock_${Date.now()}`;
      this.logger.warn({ event: 'stripe_mock', method: 'createSchoolSubscription', mockId });
      return {
        subscriptionId: mockId,
        status: params.trialDays ? 'trialing' : 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        latestInvoiceUrl: undefined,
      };
    }

    const sub = await this.client.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId, quantity: params.quantity }],
      collection_method: 'send_invoice',
      days_until_due: params.daysUntilDue,
      metadata: params.metadata,
      ...(params.trialDays ? { trial_period_days: params.trialDays } : {}),
      expand: ['latest_invoice'],
    });

    // Stripe SDK v20 moved current_period_end onto the subscription item
    // (Unix seconds). The expanded latest_invoice supplies the hosted URL.
    const invoice =
      sub.latest_invoice !== null && typeof sub.latest_invoice === 'object'
        ? (sub.latest_invoice as Stripe.Invoice)
        : null;
    const currentPeriodEnd: number = this.firstItem(sub).current_period_end;

    this.logger.log({ event: 'stripe_school_subscription_created', subscriptionId: sub.id });
    return {
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd,
      latestInvoiceUrl: invoice?.hosted_invoice_url ?? undefined,
    };
  }

  /**
   * Update a subscription's single line-item quantity, prorating the change.
   * @param subscriptionId - Stripe subscription id.
   * @param quantity - New seat quantity.
   * @returns Updated status, period end, and quantity.
   */
  async updateSubscriptionQuantity(
    subscriptionId: string,
    quantity: number,
  ): Promise<QuantityUpdateResult> {
    if (!this.client) {
      this.logger.warn({ event: 'stripe_mock', method: 'updateSubscriptionQuantity' });
      return {
        status: 'active',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        seatQuantity: quantity,
      };
    }

    const current = await this.client.subscriptions.retrieve(subscriptionId);
    const updated = await this.client.subscriptions.update(subscriptionId, {
      items: [{ id: this.firstItem(current).id, quantity }],
      proration_behavior: 'create_prorations',
    });

    // Stripe SDK v20 moved current_period_end onto the subscription item (Unix seconds).
    const currentPeriodEnd: number = this.firstItem(updated).current_period_end;

    this.logger.log({ event: 'stripe_subscription_quantity_updated', subscriptionId, quantity });
    return {
      status: updated.status,
      currentPeriodEnd,
      seatQuantity: quantity,
    };
  }

  /**
   * Return a subscription's first line item, or throw if it has none.
   * @param sub - A Stripe subscription.
   * @returns The first subscription item.
   */
  private firstItem(sub: Stripe.Subscription): Stripe.SubscriptionItem {
    const item = sub.items.data[0];
    if (!item) {
      throw new Error(`Stripe subscription ${sub.id} returned no line items`);
    }
    return item;
  }
}
