import { Test } from '@nestjs/testing';
import { SchoolAnalyticsController } from './school-analytics.controller';
import { SchoolAnalyticsService } from './school-analytics.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const mockService = { getOverview: jest.fn(), getSchoolRows: jest.fn() };
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolAnalyticsController', () => {
  let controller: SchoolAnalyticsController;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [SchoolAnalyticsController],
      providers: [{ provide: SchoolAnalyticsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolAnalyticsController);
  });

  it('overview delegates to the service', async () => {
    mockService.getOverview.mockResolvedValueOnce({ totalSchools: 2 });
    expect(await controller.overview()).toEqual({ totalSchools: 2 });
    expect(mockService.getOverview).toHaveBeenCalled();
  });

  it('schools wraps rows in { schools }', async () => {
    mockService.getSchoolRows.mockResolvedValueOnce([{ schoolId: 's1' }]);
    expect(await controller.schools()).toEqual({ schools: [{ schoolId: 's1' }] });
    expect(mockService.getSchoolRows).toHaveBeenCalled();
  });
});
