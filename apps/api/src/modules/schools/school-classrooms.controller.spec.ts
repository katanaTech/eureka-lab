import { Test, TestingModule } from '@nestjs/testing';
import { SchoolClassroomsController } from './school-classrooms.controller';
import { SchoolClassroomsService } from './school-classrooms.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

const mockService = { listSchoolClassrooms: jest.fn() };
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolClassroomsController', () => {
  let controller: SchoolClassroomsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolClassroomsController],
      providers: [{ provide: SchoolClassroomsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolClassroomsController);
  });

  it('list returns the classrooms rollup payload', async () => {
    const rows = [{ id: 'c1', name: 'Math', teacherName: 'Ms. Ada', studentCount: 2 }];
    mockService.listSchoolClassrooms.mockResolvedValueOnce(rows);
    expect(await controller.list('school-7')).toEqual({ classrooms: rows });
    expect(mockService.listSchoolClassrooms).toHaveBeenCalledWith('school-7');
  });
});
