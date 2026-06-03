import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SchoolBillingController } from './school-billing.controller';
import { SchoolBillingService } from './school-billing.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const mockService = {
  setUpSubscription: jest.fn(),
  getBillingSummary: jest.fn(),
  getOwnBillingSummary: jest.fn(),
  createPortalLink: jest.fn(),
};
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };
const admin = { uid: 'ad-1', email: 'a@s.edu', role: 'school_admin', schoolId: 's1' } as AuthenticatedUser;
const adminNoSchool = { uid: 'ad-2', email: 'b@s.edu', role: 'school_admin' } as AuthenticatedUser;

describe('SchoolBillingController', () => {
  let controller: SchoolBillingController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [SchoolBillingController],
      providers: [{ provide: SchoolBillingService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolBillingController);
  });

  it('setUp delegates schoolId + dto', async () => {
    mockService.setUpSubscription.mockResolvedValueOnce({ schoolId: 's1', hasSubscription: true });
    expect(await controller.setUp('s1', { billingEmail: 'b@s.edu' })).toEqual({ schoolId: 's1', hasSubscription: true });
    expect(mockService.setUpSubscription).toHaveBeenCalledWith('s1', { billingEmail: 'b@s.edu' });
  });

  it('get delegates schoolId', async () => {
    mockService.getBillingSummary.mockResolvedValueOnce({ schoolId: 's1' });
    expect(await controller.get('s1')).toEqual({ schoolId: 's1' });
    expect(mockService.getBillingSummary).toHaveBeenCalledWith('s1');
  });

  it('me reads the caller schoolId claim', async () => {
    mockService.getOwnBillingSummary.mockResolvedValueOnce({ schoolId: 's1' });
    expect(await controller.me(admin)).toEqual({ schoolId: 's1' });
    expect(mockService.getOwnBillingSummary).toHaveBeenCalledWith('s1');
  });

  it('me throws when the claim is missing', async () => {
    await expect(controller.me(adminNoSchool)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('portal uses the caller schoolId claim, not the body', async () => {
    mockService.createPortalLink.mockResolvedValueOnce({ url: 'https://p' });
    expect(await controller.portal(admin, { returnUrl: 'https://r' })).toEqual({ url: 'https://p' });
    expect(mockService.createPortalLink).toHaveBeenCalledWith('s1', 'https://r');
  });

  it('portal throws when the claim is missing', async () => {
    await expect(controller.portal(adminNoSchool, { returnUrl: 'https://r' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
