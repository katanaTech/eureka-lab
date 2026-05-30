import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

const mockSet = jest.fn();
const mockDocRef = { get: jest.fn(), set: mockSet, update: jest.fn() };
const mockCollectionRef = { doc: jest.fn().mockReturnValue(mockDocRef) };
const mockFirebaseService = {
  firestore: { collection: jest.fn().mockReturnValue(mockCollectionRef) },
};

describe('UsersRepository schoolId', () => {
  let repo: UsersRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();
    repo = moduleRef.get(UsersRepository);
  });

  it('persists schoolId when provided', async () => {
    await repo.create('admin-1', {
      email: 'a@s.edu',
      displayName: 'Admin',
      role: 'school_admin',
      schoolId: 'school-1',
    });
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet.mock.calls[0][0]).toMatchObject({
      uid: 'admin-1',
      role: 'school_admin',
      schoolId: 'school-1',
    });
  });

  it('omits schoolId when not provided', async () => {
    await repo.create('p-1', { email: 'p@x.com', displayName: 'P', role: 'parent' });
    expect(mockSet.mock.calls[0][0]).not.toHaveProperty('schoolId');
  });
});
