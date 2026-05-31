import { Test, TestingModule } from '@nestjs/testing';
import { SchoolTeachersController } from './school-teachers.controller';
import { SchoolTeachersService } from './school-teachers.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

const mockService = {
  createTeacher: jest.fn(),
  listTeachers: jest.fn(),
  setTeacherActive: jest.fn(),
};
const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SchoolTeachersController', () => {
  let controller: SchoolTeachersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolTeachersController],
      providers: [{ provide: SchoolTeachersService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .overrideGuard(TenantGuard).useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolTeachersController);
  });

  it('create delegates id + dto', async () => {
    const dto = { email: 't@s.edu', displayName: 'T', password: 'Passw0rd' };
    mockService.createTeacher.mockResolvedValueOnce({ uid: 't-9' });
    expect(await controller.create('s1', dto)).toEqual({ uid: 't-9' });
    expect(mockService.createTeacher).toHaveBeenCalledWith('s1', dto);
  });

  it('list wraps results in a { teachers } envelope', async () => {
    mockService.listTeachers.mockResolvedValueOnce([{ uid: 't-1', email: 'a@s.edu', displayName: 'A', active: true }]);
    expect(await controller.list('s1')).toEqual({ teachers: [{ uid: 't-1', email: 'a@s.edu', displayName: 'A', active: true }] });
    expect(mockService.listTeachers).toHaveBeenCalledWith('s1');
  });

  it('setActive delegates id + teacherId + active', async () => {
    mockService.setTeacherActive.mockResolvedValueOnce({ uid: 't-1', active: false });
    expect(await controller.setActive('s1', 't-1', { active: false })).toEqual({ uid: 't-1', active: false });
    expect(mockService.setTeacherActive).toHaveBeenCalledWith('s1', 't-1', false);
  });
});
