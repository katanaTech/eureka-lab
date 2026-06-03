import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolBillingService } from './school-billing.service';
import { SchoolsRepository } from '../schools/schools.repository';
import { StripeService } from '../../infrastructure/stripe/stripe.service';

const mockRepo = {
  findById: jest.fn(),
  findByStripeSubscriptionId: jest.fn(),
  findByStripeCustomerId: jest.fn(),
  updateSchool: jest.fn(),
};
const mockStripe = {
  createCustomer: jest.fn(),
  createSchoolSubscription: jest.fn(),
  createPortalSession: jest.fn(),
};
const cfg = { get: (k: string) => (k === 'STRIPE_PRICE_ID_SCHOOL_SEAT' ? 'price_seat' : undefined) };

const baseSchool = {
  id: 's1', name: 'A', status: 'active', seatLimit: 30, seatsUsed: 2,
  adminUids: [], subscription: { tier: 'trial', status: 'none' },
  secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa',
};

describe('SchoolBillingService', () => {
  let service: SchoolBillingService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchoolBillingService,
        { provide: SchoolsRepository, useValue: mockRepo },
        { provide: StripeService, useValue: mockStripe },
        { provide: ConfigService, useValue: cfg },
      ],
    }).compile();
    service = moduleRef.get(SchoolBillingService);
  });

  describe('setUpSubscription', () => {
    it('creates a customer + subscription and persists linkage', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      mockStripe.createCustomer.mockResolvedValue({ id: 'cus_1', email: 'b@s.edu' });
      mockStripe.createSchoolSubscription.mockResolvedValue({
        subscriptionId: 'sub_1', status: 'active', currentPeriodEnd: 123, latestInvoiceUrl: 'https://inv',
      });
      const res = await service.setUpSubscription('s1', { billingEmail: 'b@s.edu' });
      expect(mockStripe.createSchoolSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cus_1', priceId: 'price_seat', quantity: 30, metadata: { schoolId: 's1' } }),
      );
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({
        billingEmail: 'b@s.edu',
        subscription: expect.objectContaining({ stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1', status: 'active', seatQuantity: 30, collectionMethod: 'send_invoice' }),
      }));
      expect(res.latestInvoiceUrl).toBe('https://inv');
      expect(res.hasSubscription).toBe(true);
    });

    it('passes trialDays through when provided', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      mockStripe.createCustomer.mockResolvedValue({ id: 'cus_1', email: 'b@s.edu' });
      mockStripe.createSchoolSubscription.mockResolvedValue({ subscriptionId: 'sub_1', status: 'trialing', currentPeriodEnd: 1 });
      await service.setUpSubscription('s1', { billingEmail: 'b@s.edu', trialDays: 14 });
      expect(mockStripe.createSchoolSubscription).toHaveBeenCalledWith(expect.objectContaining({ trialDays: 14 }));
    });

    it('reuses an existing stripeCustomerId', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'trial', status: 'none', stripeCustomerId: 'cus_old' } });
      mockStripe.createSchoolSubscription.mockResolvedValue({ subscriptionId: 'sub_2', status: 'active', currentPeriodEnd: 1 });
      await service.setUpSubscription('s1', { billingEmail: 'b@s.edu' });
      expect(mockStripe.createCustomer).not.toHaveBeenCalled();
      expect(mockStripe.createSchoolSubscription).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'cus_old' }));
    });

    it('rejects when a subscription already exists', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'standard', status: 'active', stripeSubscriptionId: 'sub_existing' } });
      await expect(service.setUpSubscription('s1', { billingEmail: 'b@s.edu' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound when the school is missing', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.setUpSubscription('s1', { billingEmail: 'b@s.edu' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest when the seat price is not configured', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          SchoolBillingService,
          { provide: SchoolsRepository, useValue: mockRepo },
          { provide: StripeService, useValue: mockStripe },
          { provide: ConfigService, useValue: { get: () => undefined } },
        ],
      }).compile();
      const svc = moduleRef.get(SchoolBillingService);
      mockRepo.findById.mockResolvedValue(baseSchool);
      await expect(svc.setUpSubscription('s1', { billingEmail: 'b@s.edu' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createPortalLink', () => {
    it('throws BadRequest when no customer', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      await expect(service.createPortalLink('s1', 'https://ret')).rejects.toBeInstanceOf(BadRequestException);
    });
    it('returns a portal url', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'standard', status: 'active', stripeCustomerId: 'cus_1' } });
      mockStripe.createPortalSession.mockResolvedValue({ url: 'https://portal' });
      expect(await service.createPortalLink('s1', 'https://ret')).toEqual({ url: 'https://portal' });
    });
  });

  describe('getBillingSummary', () => {
    it('maps the school doc to a summary', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'standard', status: 'past_due', stripeSubscriptionId: 'sub_1', seatQuantity: 30, periodEnd: 99 } });
      const s = await service.getBillingSummary('s1');
      expect(s).toEqual(expect.objectContaining({ schoolId: 's1', tier: 'standard', status: 'past_due', seatLimit: 30, seatsUsed: 2, hasSubscription: true }));
    });

    it('reports status none for a school with no subscription (even if doc says active)', async () => {
      mockRepo.findById.mockResolvedValue({ ...baseSchool, subscription: { tier: 'trial', status: 'active' } });
      const s = await service.getBillingSummary('s1');
      expect(s.status).toBe('none');
      expect(s.hasSubscription).toBe(false);
    });

    it('throws NotFound when the school is missing', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getBillingSummary('s1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getOwnBillingSummary', () => {
    it('maps the school doc to a summary', async () => {
      mockRepo.findById.mockResolvedValue(baseSchool);
      const s = await service.getOwnBillingSummary('s1');
      expect(s).toEqual(expect.objectContaining({ schoolId: 's1', hasSubscription: false }));
    });
    it('throws NotFound when the school is missing', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getOwnBillingSummary('s1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('handleWebhookEvent', () => {
    it('subscription.updated syncs status/periodEnd/qty (v20 item shape)', async () => {
      mockRepo.findByStripeSubscriptionId.mockResolvedValue(baseSchool);
      // Stripe SDK v20: current_period_end lives on the subscription item.
      await service.handleWebhookEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', items: { data: [{ quantity: 40, current_period_end: 200 }] } });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({ subscription: expect.objectContaining({ status: 'active', periodEnd: 200, seatQuantity: 40 }) }));
    });
    it('invoice.payment_failed marks past_due via customer lookup', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('invoice.payment_failed', { customer: 'cus_1' });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({ subscription: expect.objectContaining({ status: 'past_due' }) }));
    });
    it('invoice.paid marks active', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('invoice.paid', { customer: 'cus_1' });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('s1', expect.objectContaining({ subscription: expect.objectContaining({ status: 'active' }) }));
    });
    it('subscription.deleted marks canceled, never suspends', async () => {
      mockRepo.findByStripeSubscriptionId.mockResolvedValue(baseSchool);
      await service.handleWebhookEvent('customer.subscription.deleted', { id: 'sub_1' });
      const arg = mockRepo.updateSchool.mock.calls[0][1];
      expect(arg.subscription.status).toBe('canceled');
      expect(arg.status).toBeUndefined(); // school status untouched
    });
    it('no-ops when no school matches', async () => {
      mockRepo.findByStripeSubscriptionId.mockResolvedValue(null);
      await service.handleWebhookEvent('customer.subscription.updated', { id: 'sub_x', status: 'active' });
      expect(mockRepo.updateSchool).not.toHaveBeenCalled();
    });

    it('ignores an unrelated event type (default branch)', async () => {
      await service.handleWebhookEvent('charge.succeeded', {});
      expect(mockRepo.updateSchool).not.toHaveBeenCalled();
    });
    it('no-ops a subscription.updated with no status', async () => {
      await service.handleWebhookEvent('customer.subscription.updated', { id: 'sub_1' });
      expect(mockRepo.findByStripeSubscriptionId).not.toHaveBeenCalled();
      expect(mockRepo.updateSchool).not.toHaveBeenCalled();
    });
    it('no-ops an invoice event with no customer', async () => {
      await service.handleWebhookEvent('invoice.payment_failed', {});
      expect(mockRepo.updateSchool).not.toHaveBeenCalled();
    });
  });

  describe('matchesSchoolEvent', () => {
    // as never bridges the test fixture to the Stripe event type
    it('true for subscription event with schoolId metadata', async () => {
      expect(await service.matchesSchoolEvent({ type: 'customer.subscription.updated', data: { object: { metadata: { schoolId: 's1' } } } } as never)).toBe(true);
    });
    it('false for subscription event with userId metadata', async () => {
      expect(await service.matchesSchoolEvent({ type: 'customer.subscription.updated', data: { object: { metadata: { userId: 'u1' } } } } as never)).toBe(false);
    });
    it('invoice event resolves via customer lookup', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(baseSchool);
      expect(await service.matchesSchoolEvent({ type: 'invoice.paid', data: { object: { customer: 'cus_1' } } } as never)).toBe(true);
    });
    it('invoice event with unknown customer is not a school event', async () => {
      mockRepo.findByStripeCustomerId.mockResolvedValue(null);
      expect(await service.matchesSchoolEvent({ type: 'invoice.payment_failed', data: { object: { customer: 'cus_z' } } } as never)).toBe(false);
    });
    it('false for an unrelated event type', async () => {
      expect(await service.matchesSchoolEvent({ type: 'charge.succeeded', data: { object: {} } } as never)).toBe(false);
    });
    it('invoice event with no customer field returns false', async () => {
      expect(await service.matchesSchoolEvent({ type: 'invoice.paid', data: { object: {} } } as never)).toBe(false);
    });
  });
});
