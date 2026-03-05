import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Unit tests for PaymentsController.
 * Tests checkout/portal delegation and webhook signature verification flow.
 * Guards are overridden — guard behavior is NOT tested at unit level.
 */
describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockPaymentsService = {
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    handleWebhookEvent: jest.fn(),
  };

  const mockStripeService = {
    constructWebhookEvent: jest.fn(),
  };

  /** Mock authenticated parent user */
  const mockUser: AuthenticatedUser = {
    uid: 'parent-1',
    email: 'parent@test.com',
    role: 'parent',
  };

  /** No-op guard that always passes */
  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: StripeService, useValue: mockStripeService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);

    mockPaymentsService.handleWebhookEvent.mockResolvedValue(undefined);
  });

  describe('createCheckout', () => {
    it('should delegate to PaymentsService with correct arguments', async () => {
      mockPaymentsService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_123',
        url: 'https://checkout.stripe.com/cs_123',
      });

      const result = await controller.createCheckout(
        { plan: 'explorer' },
        mockUser,
      );

      expect(mockPaymentsService.createCheckoutSession).toHaveBeenCalledWith(
        'parent-1', 'explorer',
      );
      expect(result.sessionId).toBe('cs_123');
      expect(result.url).toContain('checkout.stripe.com');
    });

    it('should pass creator plan correctly', async () => {
      mockPaymentsService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_456',
        url: 'https://checkout.stripe.com/cs_456',
      });

      await controller.createCheckout({ plan: 'creator' }, mockUser);

      expect(mockPaymentsService.createCheckoutSession).toHaveBeenCalledWith(
        'parent-1', 'creator',
      );
    });
  });

  describe('createPortal', () => {
    it('should delegate to PaymentsService with correct arguments', async () => {
      mockPaymentsService.createPortalSession.mockResolvedValue({
        url: 'https://billing.stripe.com/portal',
      });

      const result = await controller.createPortal(
        { returnUrl: 'http://localhost:3010/settings' },
        mockUser,
      );

      expect(mockPaymentsService.createPortalSession).toHaveBeenCalledWith(
        'parent-1', 'http://localhost:3010/settings',
      );
      expect(result.url).toContain('billing.stripe.com');
    });
  });

  describe('handleWebhook', () => {
    /** Build mock Fastify request with rawBody */
    const buildReq = (rawBody: string | undefined, signature?: string) => ({
      rawBody,
      headers: { 'stripe-signature': signature },
    });

    /** Build mock Fastify reply */
    const buildRes = () => ({
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(undefined),
    });

    it('should process valid webhook and return received:true', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: { metadata: { userId: 'parent-1' } } },
      };
      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const req = buildReq('{"raw":"body"}', 'sig_valid');
      const res = buildRes();

      await controller.handleWebhook(req as never, 'sig_valid', res as never);

      expect(mockStripeService.constructWebhookEvent).toHaveBeenCalledWith(
        '{"raw":"body"}', 'sig_valid',
      );
      expect(mockPaymentsService.handleWebhookEvent).toHaveBeenCalledWith(
        'checkout.session.completed',
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ received: true });
    });

    it('should throw BadRequestException when stripe-signature is missing', async () => {
      const req = buildReq('{"raw":"body"}');
      const res = buildRes();

      await expect(
        controller.handleWebhook(req as never, undefined, res as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when rawBody is missing', async () => {
      const req = buildReq(undefined, 'sig_valid');
      const res = buildRes();

      await expect(
        controller.handleWebhook(req as never, 'sig_valid', res as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when webhook signature is invalid', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue(null);

      const req = buildReq('{"raw":"body"}', 'sig_invalid');
      const res = buildRes();

      await expect(
        controller.handleWebhook(req as never, 'sig_invalid', res as never),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
