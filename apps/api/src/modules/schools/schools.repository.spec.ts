import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { School } from '@eureka-lab/shared-types';

const mockSet = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockLimitGet = jest.fn();
const mockDocRef = { id: 'auto-id-1', get: mockGet, set: mockSet, update: mockUpdate };
const mockCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDocRef),
  limit: jest.fn().mockReturnValue({ get: mockLimitGet }),
};
const mockFirebaseService = {
  firestore: { collection: jest.fn().mockReturnValue(mockCollectionRef) },
};

const school: School = {
  id: 'school-1', name: 'Springfield Elementary', status: 'active',
  seatLimit: 100, seatsUsed: 0, adminUids: [],
  subscription: { tier: 'trial', status: 'active' },
  secretKeys: { enrollmentSecret: 'sek_x' },
  createdAt: 1000, createdBy: 'sa-1',
};

describe('SchoolsRepository', () => {
  let repo: SchoolsRepository;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [SchoolsRepository, { provide: FirebaseService, useValue: mockFirebaseService }],
    }).compile();
    repo = moduleRef.get(SchoolsRepository);
  });

  it('newId returns a firestore auto id', () => {
    expect(repo.newId()).toBe('auto-id-1');
  });

  it('createSchool writes the doc and returns it', async () => {
    const result = await repo.createSchool(school);
    expect(mockSet).toHaveBeenCalledWith(school);
    expect(result).toEqual(school);
  });

  it('findById returns null when missing', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });
    expect(await repo.findById('nope')).toBeNull();
  });

  it('findById returns the school data when present', async () => {
    mockGet.mockResolvedValueOnce({ exists: true, data: () => school });
    expect(await repo.findById('school-1')).toEqual(school);
  });

  it('listAll maps docs to data (bounded)', async () => {
    mockLimitGet.mockResolvedValueOnce({ docs: [{ data: () => school }] });
    expect(await repo.listAll()).toEqual([school]);
    expect(mockCollectionRef.limit).toHaveBeenCalledWith(500);
  });

  it('addAdminUid arrayUnions the uid', async () => {
    await repo.addAdminUid('school-1', 'admin-9');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('incrementSeatsUsed updates with a delta', async () => {
    await repo.incrementSeatsUsed('school-1', 1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
