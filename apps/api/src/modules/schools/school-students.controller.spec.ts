import { Test, TestingModule } from '@nestjs/testing';
import { SchoolStudentsController } from './school-students.controller';
import { SchoolStudentsService } from './school-students.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

const mockService = {
  createStudent: jest.fn(),
  listRoster: jest.fn(),
  setStudentActive: jest.fn(),
};
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };
const admin = { uid: 'admin-1', email: 'a@s.edu', role: 'school_admin' } as AuthenticatedUser;

describe('SchoolStudentsController', () => {
  let controller: SchoolStudentsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolStudentsController],
      providers: [{ provide: SchoolStudentsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolStudentsController);
  });

  it('create delegates id + dto + admin uid', async () => {
    const dto = { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2015, consentAttested: true };
    mockService.createStudent.mockResolvedValueOnce({ uid: 's-9' });
    expect(await controller.create(admin, 's1', dto)).toEqual({ uid: 's-9' });
    expect(mockService.createStudent).toHaveBeenCalledWith('s1', dto, 'admin-1');
  });

  it('list returns the roster payload', async () => {
    const roster = { students: [], loginCode: 'AB12CD', seatsUsed: 0, seatLimit: 30 };
    mockService.listRoster.mockResolvedValueOnce(roster);
    expect(await controller.list('s1')).toEqual(roster);
    expect(mockService.listRoster).toHaveBeenCalledWith('s1');
  });

  it('setActive delegates id + studentId + active', async () => {
    mockService.setStudentActive.mockResolvedValueOnce({ uid: 's-1', active: false });
    expect(await controller.setActive('s1', 's-1', { active: false })).toEqual({ uid: 's-1', active: false });
    expect(mockService.setStudentActive).toHaveBeenCalledWith('s1', 's-1', false);
  });
});
