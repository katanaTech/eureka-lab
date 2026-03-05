import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Unit tests for PaymentsService.
 * Tests checkout session creation, portal session creation, and all 4 webhook event handlers.
 */
describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockStripeService = {
    createCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    constructWebhookEvent: jest.fn(),
    getSubscription: jest.fn(),
  };

  const mockUsersRepository = {
    findByUid: jest.fn(),
    updateSubscription: jest.fn(),
    clearSubscription: jest.fn(),
    findByStripeCustomerId: jest.fn(),
    findByStripeSubscriptionId: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        STRIPE_PRICE_ID_EXPLORER: 'price_explorer_test',
        STRIPE_PRICE_ID_CREATOR: 'price_creator_test',
        FRONTEND_URL: 'http://localhost:3010',
      };
      return config[key];
    }),
  };

  /** Standard parent user fixture */
  const parentUser = {
    uid: 'parent-1',
    email: 'parent@test.com',
    displayName: 'Test Parent',
    role: 'parent' as const,
    plan: 'free' as const,
    xp: 0,
    streak: 0,
  };

  /** Parent with existing Stripe customer */
  const parentWithSub = {
    ...parentUser,
    subscription: {
      stripeCustomerId: 'cus_existing',
      stripeSubscriptionId: 'sub_existing',
      status: 'active' as const,
      currentPeriodEnd: 1700000000,
      cancelAtPeriodEnd: false,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: StripeService, useValue: mockStripeService },
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    mockUsersRepository.updateSubscription.mockResolvedValue(undefined);
    mockUsersRepository.clearSubscription.mockResolvedValue(undefined);
  });

  describe('createCheckoutSession', () => {
    it('should create customer then checkout for user without Stripe customer', async () => {
      mockUsersRepository.findByUid.mockResolvedValue(parentUser);
      mockStripeService.createCustomer.mockResolvedValue({ id: 'cus_new', email: 'parent@test.com' });
      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_123',
        url: 'https://checkout.stripe.com/cs_123',
      });

      const result = await service.createCheckoutSession('parent-1', 'explorer');

      expect(mockStripeService.createCustomer).toHaveBeenCalledWith(
        'parent@test.com', 'Test Parent', { userId: 'parent-1', role: 'parent' },
      );
      expect(mockUsersRepository.updateSubscription).toHaveBeenCalled();
      expect(result.sessionId).toBe('cs_123');
      expect(result.url).toContain('checkout.stripe.com');
    });

    it('should skip customer creation when user already has stripeCustomerId', async () => {
      mockUsersRepository.findByUid.mockResolvedValue(parentWithSub);
      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_456',
        url: 'https://checkout.stripe.com/cs_456',
      });

      const result = await service.createCheckoutSession('parent-1', 'creator');

      expect(mockStripeService.createCustomer).not.toHaveBeenCalled();
      expect(result.sessionId).toBe('cs_456');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.findByUid.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession('missing-uid', 'explorer'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user is not a parent', async () => {
      mockUsersRepository.findByUid.mockResolvedValue({
        ...parentUser, uid: 'child-1', role: 'child',
      });

      await expect(
        service.createCheckoutSession('child-1', 'explorer'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPortalSession', () => {
    it('should return portal URL for user with active subscription', async () => {
      mockUsersRepository.findByUid.mockResolvedValue(parentWithSub);
      mockStripeService.createPortalSession.mockResolvedValue({
        url: 'https://billing.stripe.com/portal',
      });

      const result = await service.createPortalSession('parent-1', 'http://localhost:3010/settings');

      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith(
        'cus_existing', 'http://localhost:3010/settings',
      );
      expect(result.url).toContain('billing.stripe.com');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.findByUid.mockResolvedValue(null);

      await expect(
        service.createPortalSession('missing-uid', 'http://localhost'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user has no stripeCustomerId', async () => {
      mockUsersRepository.findByUid.mockResolvedValue(parentUser);

      await expect(
        service.createPortalSession('parent-1', 'http://localhost'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleWebhookEvent', () => {
    describe('checkout.session.completed', () => {
      it('should activate subscription with correct plan', async () => {
        mockStripeService.getSubscription.mockResolvedValue({
          billing_cycle_anchor: 1700000000,
        });

        await service.handleWebhookEvent('checkout.session.completed', {
          metadata: { userId: 'parent-1', plan: 'explorer' },
          subscription: 'sub_new',
          customer: 'cus_new',
        });

        expect(mockUsersRepository.updateSubscription).toHaveBeenCalledWith(
          'parent-1',
          'explorer',
          expect.objectContaining({
            stripeCustomerId: 'cus_new',
            stripeSubscriptionId: 'sub_new',
            status: 'active',
            cancelAtPeriodEnd: false,
          }),
        );
      });

      it('should handle missing metadata gracefully', async () => {
        await service.handleWebhookEvent('checkout.session.completed', {
          subscription: 'sub_new',
          customer: 'cus_new',
        });

        expect(mockUsersRepository.updateSubscription).not.toHaveBeenCalled();
      });

      it('should fallback to estimated period end when subscription lookup fails', async () => {
        mockStripeService.getSubscription.mockResolvedValue(null);

        await service.handleWebhookEvent('checkout.session.completed', {
          metadata: { userId: 'parent-1', plan: 'creator' },
          subscription: 'sub_new',
          customer: 'cus_new',
        });

        expect(mockUsersRepository.updateSubscription).toHaveBeenCalledWith(
          'parent-1',
          'creator',
          expect.objectContaining({ status: 'active' }),
        );
      });
    });

    describe('customer.subscription.updated', () => {
      it('should sync subscription status changes', async () => {
        mockUsersRepository.findByStripeSubscriptionId.mockResolvedValue(parentWithSub);

        await service.handleWebhookEvent('customer.subscription.updated', {
          id: 'sub_existing',
          status: 'active',
          cancel_at_period_end: true,
          current_period_end: 1700500000,
        });

        expect(mockUsersRepository.updateSubscription).toHaveBeenCalledWith(
          'parent-1',
          'free',
          expect.objectContaining({
            status: 'active',
            cancelAtPeriodEnd: true,
            currentPeriodEnd: 1700500000,
          }),
        );
      });

      it('should warn and return when user not found', async () => {
        mockUsersRepository.findByStripeSubscriptionId.mockResolvedValue(null);

        await service.handleWebhookEvent('customer.subscription.updated', {
          id: 'sub_unknown',
          status: 'active',
        });

        expect(mockUsersRepository.updateSubscription).not.toHaveBeenCalled();
      });

      it('should return early when subscription ID is missing', async () => {
        await service.handleWebhookEvent('customer.subscription.updated', {});

        expect(mockUsersRepository.findByStripeSubscriptionId).not.toHaveBeenCalled();
      });
    });

    describe('customer.subscription.deleted', () => {
      it('should downgrade user to free plan', async () => {
        mockUsersRepository.findByStripeSubscriptionId.mockResolvedValue(parentWithSub);

        await service.handleWebhookEvent('customer.subscription.deleted', {
          id: 'sub_existing',
        });

        expect(mockUsersRepository.clearSubscription).toHaveBeenCalledWith('parent-1');
      });

      it('should warn and return when user not found', async () => {
        mockUsersRepository.findByStripeSubscriptionId.mockResolvedValue(null);

        await service.handleWebhookEvent('customer.subscription.deleted', {
          id: 'sub_unknown',
        });

        expect(mockUsersRepository.clearSubscription).not.toHaveBeenCalled();
      });
    });

    describe('invoice.payment_failed', () => {
      it('should set subscription status to past_due', async () => {
        mockUsersRepository.findByStripeCustomerId.mockResolvedValue(parentWithSub);

        await service.handleWebhookEvent('invoice.payment_failed', {
          customer: 'cus_existing',
        });

        expect(mockUsersRepository.updateSubscription).toHaveBeenCalledWith(
          'parent-1',
          'free',
          expect.objectContaining({ status: 'past_due' }),
        );
      });

      it('should warn and return when user not found', async () => {
        mockUsersRepository.findByStripeCustomerId.mockResolvedValue(null);

        await service.handleWebhookEvent('invoice.payment_failed', {
          customer: 'cus_unknown',
        });

        expect(mockUsersRepository.updateSubscription).not.toHaveBeenCalled();
      });
    });

    describe('unknown event', () => {
      it('should log and return without error', async () => {
        await expect(
          service.handleWebhookEvent('some.unknown.event', {}),
        ).resolves.toBeUndefined();
      });
    });
  });
});
