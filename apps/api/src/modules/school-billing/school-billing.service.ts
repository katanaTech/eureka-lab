import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { School, SchoolBillingSummary, SchoolSubscription } from '@eureka-lab/shared-types';
import { SchoolsRepository } from '../schools/schools.repository';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { CreateSchoolSubscriptionDto } from './dto/create-school-subscription.dto';

/** Days until an issued school invoice is due. */
const DAYS_UNTIL_DUE = 14;

/**
 * B2B school billing: super-admin subscription setup, payment status sync,
 * and the school-admin Customer Portal link. Billing state lives on the
 * `schools/{id}` doc; consumer billing (PaymentsService) is untouched.
 */
@Injectable()
export class SchoolBillingService {
  private readonly logger = new Logger(SchoolBillingService.name);
  private readonly seatPriceId: string;

  constructor(
    private readonly schools: SchoolsRepository,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {
    this.seatPriceId = this.config.get<string>('STRIPE_PRICE_ID_SCHOOL_SEAT') ?? '';
  }

  /**
   * Set up a per-seat subscription for a school (super_admin action).
   * @param schoolId - Target school id.
   * @param dto - billingEmail + optional trialDays.
   * @returns The resulting billing summary (incl. latestInvoiceUrl).
   * @throws NotFoundException when the school is missing.
   * @throws ConflictException when a subscription already exists.
   * @throws BadRequestException when the seat price id is not configured.
   */
  async setUpSubscription(
    schoolId: string,
    dto: CreateSchoolSubscriptionDto,
  ): Promise<SchoolBillingSummary> {
    const school = await this.schools.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    if (school.subscription.stripeSubscriptionId) {
      throw new ConflictException({ message: 'Subscription already exists', code: 'SUBSCRIPTION_EXISTS' });
    }
    if (!this.seatPriceId) {
      throw new BadRequestException({ message: 'Seat price not configured', code: 'PRICE_NOT_CONFIGURED' });
    }

    let customerId = school.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.createCustomer(dto.billingEmail, school.name, { schoolId });
      customerId = customer.id;
    }

    const result = await this.stripe.createSchoolSubscription({
      customerId,
      priceId: this.seatPriceId,
      quantity: school.seatLimit,
      daysUntilDue: DAYS_UNTIL_DUE,
      trialDays: dto.trialDays,
      metadata: { schoolId },
    });

    const subscription: SchoolSubscription = {
      tier: school.subscription.tier,
      status: result.status,
      periodEnd: result.currentPeriodEnd,
      stripeCustomerId: customerId,
      stripeSubscriptionId: result.subscriptionId,
      seatQuantity: school.seatLimit,
      collectionMethod: 'send_invoice',
    };
    await this.schools.updateSchool(schoolId, { subscription, billingEmail: dto.billingEmail });

    this.logger.log({ event: 'school_subscription_setup', schoolId, subscriptionId: result.subscriptionId });
    return this.toSummary({ ...school, subscription, billingEmail: dto.billingEmail }, result.latestInvoiceUrl);
  }

  /**
   * Billing summary for any school (super_admin view).
   * @param schoolId - School id.
   * @returns Billing summary.
   * @throws NotFoundException when missing.
   */
  async getBillingSummary(schoolId: string): Promise<SchoolBillingSummary> {
    const school = await this.requireSchool(schoolId);
    return this.toSummary(school);
  }

  /**
   * Billing summary for the caller's own school (school_admin view, no invoice URL).
   * Currently identical to getBillingSummary; kept distinct so the school-admin view can diverge
   * (e.g. omit fields) without affecting the super-admin path.
   * @param schoolId - The caller's schoolId claim.
   * @returns Billing summary.
   * @throws NotFoundException when missing.
   */
  async getOwnBillingSummary(schoolId: string): Promise<SchoolBillingSummary> {
    const school = await this.requireSchool(schoolId);
    return this.toSummary(school);
  }

  /**
   * Create a Customer Portal session for a school.
   * @param schoolId - School id.
   * @param returnUrl - URL to return to after the portal.
   * @returns The portal URL.
   * @throws NotFoundException when the school is missing.
   * @throws BadRequestException when the school has no Stripe customer.
   */
  async createPortalLink(schoolId: string, returnUrl: string): Promise<{ url: string }> {
    const school = await this.requireSchool(schoolId);
    const customerId = school.subscription.stripeCustomerId;
    if (!customerId) {
      throw new BadRequestException({ message: 'No subscription found', code: 'NO_SUBSCRIPTION' });
    }
    return this.stripe.createPortalSession(customerId, returnUrl);
  }

  /**
   * Decide whether a Stripe event belongs to a school (vs consumer).
   * Subscription events carry metadata.schoolId; invoice events are resolved
   * by looking up the customer id (invoices do not inherit sub metadata).
   * @param event - Stripe event ({ type, data.object }).
   * @returns True when the event targets a school.
   */
  async matchesSchoolEvent(event: {
    type: string;
    data: { object: Record<string, unknown> };
  }): Promise<boolean> {
    const obj = event.data.object;
    if (event.type.startsWith('customer.subscription.')) {
      const metadata = obj['metadata'] as Record<string, string> | undefined;
      return Boolean(metadata?.['schoolId']);
    }
    if (event.type.startsWith('invoice.')) {
      const customerId = obj['customer'] as string | undefined;
      if (!customerId) return false;
      return Boolean(await this.schools.findByStripeCustomerId(customerId));
    }
    return false;
  }

  /**
   * Apply a verified school billing webhook event to the school doc.
   * @param eventType - Stripe event type.
   * @param data - Event data object.
   */
  async handleWebhookEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    switch (eventType) {
      case 'customer.subscription.updated': {
        const status = typeof data['status'] === 'string' ? data['status'] : undefined;
        if (!status) {
          this.logger.warn({ event: 'school_webhook_missing_status' });
          break;
        }
        await this.syncFromSubscription(data, { status });
        break;
      }
      case 'customer.subscription.deleted':
        await this.syncFromSubscription(data, { status: 'canceled' });
        break;
      case 'invoice.payment_failed':
        await this.syncFromCustomer(data, 'past_due');
        break;
      case 'invoice.paid':
        await this.syncFromCustomer(data, 'active');
        break;
      default:
        this.logger.log({ event: 'school_webhook_ignored', eventType });
    }
  }

  /**
   * Update a school's subscription status from a subscription-shaped event.
   * @param data - Subscription event object (id, status, current_period_end, items).
   * @param override - Status override (e.g. 'canceled').
   */
  private async syncFromSubscription(
    data: Record<string, unknown>,
    override: { status: string },
  ): Promise<void> {
    const subscriptionId = data['id'] as string | undefined;
    if (!subscriptionId) return;
    const school = await this.schools.findByStripeSubscriptionId(subscriptionId);
    if (!school) {
      this.logger.warn({ event: 'school_webhook_no_match', subscriptionId });
      return;
    }
    const periodEnd = data['current_period_end'] as number | undefined;
    const items = data['items'] as { data?: Array<{ quantity?: number }> } | undefined;
    const qty = items?.data?.[0]?.quantity;
    const subscription: SchoolSubscription = {
      ...school.subscription,
      status: override.status,
      ...(periodEnd !== undefined ? { periodEnd } : {}),
      ...(qty !== undefined ? { seatQuantity: qty } : {}),
    };
    await this.schools.updateSchool(school.id, { subscription });
    this.logger.log({ event: 'school_subscription_synced', schoolId: school.id, status: override.status });
  }

  /**
   * Update a school's subscription status from an invoice-shaped event.
   * @param data - Invoice event object (customer).
   * @param status - New status ('past_due' | 'active').
   */
  private async syncFromCustomer(data: Record<string, unknown>, status: string): Promise<void> {
    const customerId = data['customer'] as string | undefined;
    if (!customerId) return;
    const school = await this.schools.findByStripeCustomerId(customerId);
    if (!school) {
      this.logger.warn({ event: 'school_webhook_no_match', customerId });
      return;
    }
    const subscription: SchoolSubscription = { ...school.subscription, status };
    await this.schools.updateSchool(school.id, { subscription });
    this.logger.log({ event: 'school_invoice_synced', schoolId: school.id, status });
  }

  /**
   * Load a school or throw NotFound.
   * @param schoolId - School id.
   * @returns The school.
   */
  private async requireSchool(schoolId: string): Promise<School> {
    const school = await this.schools.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    return school;
  }

  /**
   * Map a school doc to a billing summary.
   * @param school - The school.
   * @param latestInvoiceUrl - Optional hosted invoice URL (super-admin setup only).
   * @returns The summary.
   */
  private toSummary(school: School, latestInvoiceUrl?: string): SchoolBillingSummary {
    const sub = school.subscription;
    return {
      schoolId: school.id,
      tier: sub.tier,
      status: sub.status,
      seatLimit: school.seatLimit,
      seatsUsed: school.seatsUsed,
      seatQuantity: sub.seatQuantity,
      periodEnd: sub.periodEnd,
      hasSubscription: Boolean(sub.stripeSubscriptionId),
      latestInvoiceUrl,
    };
  }
}
