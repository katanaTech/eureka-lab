import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

describe('StripeService school billing (mock mode)', () => {
  let service: StripeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: { get: () => undefined } }, // no keys → mock mode
      ],
    }).compile();
    service = moduleRef.get(StripeService);
    service.onModuleInit(); // sets client = null (mock)
  });

  it('createSchoolSubscription returns a deterministic mock subscription', async () => {
    const res = await service.createSchoolSubscription({
      customerId: 'cus_x',
      priceId: 'price_seat',
      quantity: 30,
      daysUntilDue: 14,
      metadata: { schoolId: 's1' },
    });
    expect(res.subscriptionId).toMatch(/^sub_mock_/);
    expect(res.status).toBe('active');
    expect(res.currentPeriodEnd).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('updateSubscriptionQuantity returns a mock result in mock mode', async () => {
    const res = await service.updateSubscriptionQuantity('sub_x', 50);
    expect(res.seatQuantity).toBe(50);
    expect(res.status).toBe('active');
  });
});
