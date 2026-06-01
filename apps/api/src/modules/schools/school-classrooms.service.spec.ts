import { Test, TestingModule } from '@nestjs/testing';
import { SchoolClassroomsService } from './school-classrooms.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockWhereGet = jest.fn();
const mockFirebaseService = {
  firestore: {
    collection: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ get: mockWhereGet }),
    }),
  },
};
const mockUsersRepository = { findByUid: jest.fn() };

describe('SchoolClassroomsService', () => {
  let service: SchoolClassroomsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolClassroomsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();
    service = moduleRef.get(SchoolClassroomsService);
  });

  it('resolves teacher names + student counts scoped to the school', async () => {
    mockWhereGet.mockResolvedValueOnce({
      docs: [
        { data: () => ({ id: 'c1', name: 'Math', teacherId: 't1', studentIds: ['a', 'b'], schoolId: 'school-7' }) },
        { data: () => ({ id: 'c2', name: 'Art', teacherId: 't2', studentIds: [], schoolId: 'school-7' }) },
      ],
    });
    mockUsersRepository.findByUid
      .mockResolvedValueOnce({ uid: 't1', displayName: 'Ms. Ada' })
      .mockResolvedValueOnce({ uid: 't2', displayName: 'Mr. Boole' });

    const res = await service.listSchoolClassrooms('school-7');
    expect(res).toEqual([
      { id: 'c1', name: 'Math', teacherName: 'Ms. Ada', studentCount: 2 },
      { id: 'c2', name: 'Art', teacherName: 'Mr. Boole', studentCount: 0 },
    ]);
  });

  it('falls back to a placeholder when the teacher doc is missing', async () => {
    mockWhereGet.mockResolvedValueOnce({
      docs: [{ data: () => ({ id: 'c1', name: 'Math', teacherId: 't-gone', studentIds: ['a'], schoolId: 'school-7' }) }],
    });
    mockUsersRepository.findByUid.mockResolvedValueOnce(null);
    const res = await service.listSchoolClassrooms('school-7');
    expect(res[0].teacherName).toBe('Unknown teacher');
    expect(res[0].studentCount).toBe(1);
  });

  it('returns an empty list when the school has no classrooms', async () => {
    mockWhereGet.mockResolvedValueOnce({ docs: [] });
    const res = await service.listSchoolClassrooms('school-7');
    expect(res).toEqual([]);
  });
});
