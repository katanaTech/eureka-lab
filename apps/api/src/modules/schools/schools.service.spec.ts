import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { ContentModerationService } from '../ai/content-moderation.service';

const mockRepo = {
  newId: jest.fn().mockReturnValue('school-1'),
  createSchool: jest.fn((s) => Promise.resolve(s)),
  findById: jest.fn(),
  listAll: jest.fn(),
  addAdminUid: jest.fn().mockResolvedValue(undefined),
  updateSchool: jest.fn().mockResolvedValue(undefined),
};
const mockCreateUser = jest.fn();
const mockSetClaims = jest.fn().mockResolvedValue(undefined);
const mockFirebase = { auth: { createUser: mockCreateUser, setCustomUserClaims: mockSetClaims } };
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined), findByUid: jest.fn() };
const mockModeration = { moderateInput: jest.fn().mockReturnValue({ passed: true }) };

describe('SchoolsService', () => {
  let service: SchoolsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepo.newId.mockReturnValue('school-1');
    mockModeration.moderateInput.mockReturnValue({ passed: true });
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        { provide: SchoolsRepository, useValue: mockRepo },
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: ContentModerationService, useValue: mockModeration },
      ],
    }).compile();
    service = moduleRef.get(SchoolsService);
  });

  describe('createSchool', () => {
    it('creates a school with counters, defaults, and a generated secret', async () => {
      const result = await service.createSchool('sa-1', { name: 'Springfield', seatLimit: 50 });
      expect(result.id).toBe('school-1');
      expect(result.status).toBe('active');
      expect(result.seatsUsed).toBe(0);
      expect(result.adminUids).toEqual([]);
      expect(result.subscription.tier).toBe('trial');
      expect(result.secretKeys.enrollmentSecret).toMatch(/^sek_[0-9a-f]{48}$/);
      expect(result.createdBy).toBe('sa-1');
      expect(mockRepo.createSchool).toHaveBeenCalledTimes(1);
    });

    it('honors a provided subscriptionTier', async () => {
      const result = await service.createSchool('sa-1', { name: 'X', seatLimit: 10, subscriptionTier: 'standard' });
      expect(result.subscription.tier).toBe('standard');
    });

    it('rejects a name that fails moderation', async () => {
      mockModeration.moderateInput.mockReturnValueOnce({ passed: false });
      await expect(service.createSchool('sa-1', { name: 'bad', seatLimit: 1 }))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mockRepo.createSchool).not.toHaveBeenCalled();
    });
  });

  describe('mintSchoolAdmin', () => {
    it('creates a firebase user, sets role+schoolId claims, writes the user doc, links admin', async () => {
      mockRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockResolvedValueOnce({ uid: 'admin-9' });
      const result = await service.mintSchoolAdmin('school-1', {
        email: 'a@s.edu', displayName: 'Admin', password: 'Passw0rd',
      });
      expect(mockSetClaims).toHaveBeenCalledWith('admin-9', { role: 'school_admin', schoolId: 'school-1' });
      expect(mockUsersRepo.create).toHaveBeenCalledWith('admin-9', {
        email: 'a@s.edu', displayName: 'Admin', role: 'school_admin', schoolId: 'school-1',
      });
      expect(mockRepo.addAdminUid).toHaveBeenCalledWith('school-1', 'admin-9');
      expect(result).toEqual({
        uid: 'admin-9', email: 'a@s.edu', displayName: 'Admin', role: 'school_admin', schoolId: 'school-1',
      });
    });

    it('throws NotFound when the school does not exist', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.mintSchoolAdmin('nope', { email: 'a@s.edu', displayName: 'A', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('maps a duplicate email to ConflictException', async () => {
      mockRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      await expect(service.mintSchoolAdmin('school-1', { email: 'dupe@s.edu', displayName: 'A', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getSchool / listSchools', () => {
    it('getSchool throws NotFound when missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.getSchool('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('listSchools maps to summaries (no secrets)', async () => {
      mockRepo.listAll.mockResolvedValueOnce([{
        id: 's1', name: 'A', status: 'active', seatLimit: 5, seatsUsed: 2,
        adminUids: [], subscription: { tier: 'trial', status: 'active' },
        secretKeys: { enrollmentSecret: 'sek_secret' }, createdAt: 1, createdBy: 'sa',
      }]);
      const result = await service.listSchools();
      expect(result).toEqual([{ id: 's1', name: 'A', status: 'active', seatLimit: 5, seatsUsed: 2 }]);
      expect(JSON.stringify(result)).not.toContain('sek_secret');
    });
  });

  describe('updateSchool', () => {
    it('throws NotFound when missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.updateSchool('nope', { status: 'suspended' }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('writes only provided fields and returns the merged school', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        id: 'school-1', name: 'A', status: 'active', seatLimit: 100, seatsUsed: 3,
        adminUids: [], subscription: { tier: 'trial', status: 'active' },
        secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa',
      });
      const result = await service.updateSchool('school-1', { seatLimit: 25 });
      expect(mockRepo.updateSchool).toHaveBeenCalledWith('school-1', { seatLimit: 25 });
      expect(result.seatLimit).toBe(25);
      expect(result.status).toBe('active');
    });
  });

  describe('listSchoolAdmins', () => {
    it('throws NotFound when missing', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);
      await expect(service.listSchoolAdmins('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolves adminUids to summaries and skips missing users', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        id: 'school-1', name: 'A', status: 'active', seatLimit: 1, seatsUsed: 0,
        adminUids: ['u-1', 'gone'], subscription: { tier: 'trial', status: 'active' },
        secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa',
      });
      mockUsersRepo.findByUid
        .mockResolvedValueOnce({ uid: 'u-1', email: 'a@s.edu', displayName: 'Admin One' })
        .mockResolvedValueOnce(null);
      const result = await service.listSchoolAdmins('school-1');
      expect(result).toEqual([{ uid: 'u-1', email: 'a@s.edu', displayName: 'Admin One' }]);
    });
  });
});
