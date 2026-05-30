import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const mockService = {
  createSchool: jest.fn(),
  listSchools: jest.fn(),
  getSchool: jest.fn(),
  mintSchoolAdmin: jest.fn(),
};

const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

const superAdmin = { uid: 'sa-1', email: 'sa@x.com', role: 'super_admin' } as AuthenticatedUser;

describe('SchoolsController', () => {
  let controller: SchoolsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [{ provide: SchoolsService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();
    controller = moduleRef.get(SchoolsController);
  });

  it('createSchool delegates to the service with the caller uid', async () => {
    const dto = { name: 'Springfield', seatLimit: 50 };
    mockService.createSchool.mockResolvedValueOnce({ id: 'school-1' });
    const result = await controller.createSchool(superAdmin, dto);
    expect(mockService.createSchool).toHaveBeenCalledWith('sa-1', dto);
    expect(result).toEqual({ id: 'school-1' });
  });

  it('listSchools wraps summaries in a { schools } envelope', async () => {
    mockService.listSchools.mockResolvedValueOnce([{ id: 's1' }]);
    expect(await controller.listSchools()).toEqual({ schools: [{ id: 's1' }] });
  });

  it('getSchool delegates by id', async () => {
    mockService.getSchool.mockResolvedValueOnce({ id: 's1' });
    expect(await controller.getSchool('s1')).toEqual({ id: 's1' });
    expect(mockService.getSchool).toHaveBeenCalledWith('s1');
  });

  it('createSchoolAdmin delegates id + dto to mintSchoolAdmin', async () => {
    const dto = { email: 'a@s.edu', displayName: 'A', password: 'Passw0rd' };
    mockService.mintSchoolAdmin.mockResolvedValueOnce({ uid: 'admin-9' });
    const result = await controller.createSchoolAdmin('s1', dto);
    expect(mockService.mintSchoolAdmin).toHaveBeenCalledWith('s1', dto);
    expect(result).toEqual({ uid: 'admin-9' });
  });
});
