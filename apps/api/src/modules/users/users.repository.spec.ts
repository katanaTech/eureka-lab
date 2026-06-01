import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockDocRef = { get: jest.fn(), set: mockSet, update: mockUpdate };

const whereChain = { where: jest.fn(), get: mockGet };
whereChain.where.mockReturnValue(whereChain);

const mockCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDocRef),
  where: jest.fn().mockReturnValue(whereChain),
};
const mockFirebaseService = {
  firestore: { collection: jest.fn().mockReturnValue(mockCollectionRef) },
};

describe('UsersRepository', () => {
  let repo: UsersRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    whereChain.where.mockReturnValue(whereChain);
    mockCollectionRef.where.mockReturnValue(whereChain);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();
    repo = moduleRef.get(UsersRepository);
  });

  describe('create schoolId/active', () => {
    it('persists schoolId when provided', async () => {
      await repo.create('admin-1', { email: 'a@s.edu', displayName: 'Admin', role: 'school_admin', schoolId: 'school-1' });
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet.mock.calls[0][0]).toMatchObject({ uid: 'admin-1', role: 'school_admin', schoolId: 'school-1' });
    });

    it('omits schoolId when not provided', async () => {
      await repo.create('p-1', { email: 'p@x.com', displayName: 'P', role: 'parent' });
      expect(mockSet.mock.calls[0][0]).not.toHaveProperty('schoolId');
    });

    it('persists active when provided', async () => {
      await repo.create('t-1', { email: 't@s.edu', displayName: 'T', role: 'teacher', schoolId: 'school-1', active: true });
      expect(mockSet.mock.calls[0][0]).toMatchObject({ active: true });
    });
  });

  describe('findTeachersBySchool', () => {
    it('queries role==teacher AND schoolId==id and maps data', async () => {
      mockGet.mockResolvedValueOnce({ docs: [{ data: () => ({ uid: 't-1', role: 'teacher', schoolId: 'school-1' }) }] });
      const result = await repo.findTeachersBySchool('school-1');
      expect(mockCollectionRef.where).toHaveBeenCalledWith('role', '==', 'teacher');
      expect(whereChain.where).toHaveBeenCalledWith('schoolId', '==', 'school-1');
      expect(result).toEqual([{ uid: 't-1', role: 'teacher', schoolId: 'school-1' }]);
    });
  });

  describe('setActive', () => {
    it('updates the active flag', async () => {
      await repo.setActive('t-1', false);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    });
  });

  describe('create username', () => {
    it('persists username when provided', async () => {
      await repo.create('s-1', { email: 'jsmith@ab12cd.students.local', displayName: 'Jamie', role: 'child', schoolId: 'school-1', username: 'jsmith' });
      expect(mockSet.mock.calls[0][0]).toMatchObject({ username: 'jsmith', role: 'child', schoolId: 'school-1' });
    });

    it('omits username when not provided', async () => {
      await repo.create('s-2', { email: 'a@b.com', displayName: 'A', role: 'child', schoolId: 'school-1' });
      expect(mockSet.mock.calls[0][0]).not.toHaveProperty('username');
    });
  });

  describe('findStudentsBySchool', () => {
    it('queries role==child AND schoolId==id and maps data', async () => {
      mockGet.mockResolvedValueOnce({ docs: [{ data: () => ({ uid: 's-1', role: 'child', schoolId: 'school-1', username: 'jsmith' }) }] });
      const result = await repo.findStudentsBySchool('school-1');
      expect(mockCollectionRef.where).toHaveBeenCalledWith('role', '==', 'child');
      expect(whereChain.where).toHaveBeenCalledWith('schoolId', '==', 'school-1');
      expect(result).toEqual([{ uid: 's-1', role: 'child', schoolId: 'school-1', username: 'jsmith' }]);
    });
  });
});
