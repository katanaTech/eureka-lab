import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolStudentsService } from './school-students.service';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockCreateUser = jest.fn();
const mockSetClaims = jest.fn().mockResolvedValue(undefined);
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);

const mockTxn = { get: jest.fn(), update: jest.fn() };
const mockAuditSet = jest.fn();
const mockDocRef = { set: mockAuditSet };
const mockFirestore = {
  collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue(mockDocRef) }),
  runTransaction: jest.fn().mockImplementation((fn: (t: typeof mockTxn) => unknown) => fn(mockTxn)),
};
const mockFirebase = {
  auth: { createUser: mockCreateUser, setCustomUserClaims: mockSetClaims, updateUser: mockUpdateUser },
  firestore: mockFirestore,
};
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined), findByUid: jest.fn(), findStudentsBySchool: jest.fn(), setActive: jest.fn().mockResolvedValue(undefined) };
const mockSchoolsRepo = { findById: jest.fn(), generateUniqueLoginCode: jest.fn().mockResolvedValue('AB12CD'), incrementSeatsUsed: jest.fn().mockResolvedValue(undefined) };

/** Helper: make the seat transaction read a school with the given seats. */
function seatSnap(seatsUsed: number, seatLimit: number, loginCode?: string) {
  mockTxn.get.mockResolvedValueOnce({ exists: true, data: () => ({ seatsUsed, seatLimit, loginCode }) });
}

describe('SchoolStudentsService', () => {
  let service: SchoolStudentsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    mockSchoolsRepo.generateUniqueLoginCode.mockResolvedValue('AB12CD');
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolStudentsService,
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: SchoolsRepository, useValue: mockSchoolsRepo },
      ],
    }).compile();
    service = moduleRef.get(SchoolStudentsService);
  });

  describe('createStudent', () => {
    it('reserves a seat, mints a child with synthetic email + school claims', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockResolvedValueOnce({ uid: 's-9' });
      const result = await service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2015, consentAttested: true }, 'admin-1');
      expect(mockTxn.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ seatsUsed: 1 }));
      expect(mockCreateUser).toHaveBeenCalledWith({ email: 'jsmith@ab12cd.students.local', password: 'hunter2!', displayName: 'Jamie' });
      expect(mockSetClaims).toHaveBeenCalledWith('s-9', { role: 'child', schoolId: 'school-1' });
      expect(mockUsersRepo.create).toHaveBeenCalledWith('s-9', { email: 'jsmith@ab12cd.students.local', displayName: 'Jamie', role: 'child', schoolId: 'school-1', username: 'jsmith', birthYear: 2015, active: true });
      expect(mockAuditSet).toHaveBeenCalledWith(expect.objectContaining({ studentUid: 's-9', schoolId: 'school-1', adminUid: 'admin-1', username: 'jsmith', birthYear: 2015 }));
      expect(result).toEqual({ uid: 's-9', username: 'jsmith', displayName: 'Jamie', active: true });
    });

    it('skips the consent audit for 13+ students', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockResolvedValueOnce({ uid: 's-10' });
      await service.createStudent('school-1', { displayName: 'Alex', username: 'alex01', password: 'hunter2!', birthYear: 2008, consentAttested: false }, 'admin-1');
      expect(mockAuditSet).not.toHaveBeenCalled();
    });

    it('throws CONSENT_REQUIRED for under-13 without attestation (no seat touched)', async () => {
      await expect(service.createStudent('school-1', { displayName: 'Sam', username: 'sam01', password: 'hunter2!', birthYear: 2016, consentAttested: false }, 'admin-1'))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mockFirestore.runTransaction).not.toHaveBeenCalled();
      expect(mockSchoolsRepo.generateUniqueLoginCode).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('does not require consent for a child who is 13+ all year (year-age 14)', async () => {
      const birthYear = new Date().getFullYear() - 14;
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockResolvedValueOnce({ uid: 's-14' });
      await service.createStudent('school-1', { displayName: 'Lee', username: 'lee01', password: 'hunter2!', birthYear, consentAttested: false }, 'admin-1');
      expect(mockAuditSet).not.toHaveBeenCalled();
    });

    it('still throws USERNAME_TAKEN even when the seat release itself fails', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      mockSchoolsRepo.incrementSeatsUsed.mockRejectedValueOnce(new Error('Firestore unreachable'));
      await expect(service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }, 'admin-1'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('throws SEAT_LIMIT_REACHED when the school is full', async () => {
      seatSnap(30, 30, 'AB12CD');
      await expect(service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }, 'admin-1'))
        .rejects.toBeInstanceOf(ConflictException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('maps duplicate username to USERNAME_TAKEN and releases the seat', async () => {
      seatSnap(0, 30, 'AB12CD');
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      await expect(service.createStudent('school-1', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }, 'admin-1'))
        .rejects.toBeInstanceOf(ConflictException);
      expect(mockSchoolsRepo.incrementSeatsUsed).toHaveBeenCalledWith('school-1', -1);
    });

    it('throws NotFound when the school is missing', async () => {
      mockTxn.get.mockResolvedValueOnce({ exists: false });
      await expect(service.createStudent('nope', { displayName: 'Jamie', username: 'jsmith', password: 'hunter2!', birthYear: 2008, consentAttested: false }, 'admin-1'))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('requires consent for a child who may still be 12 this year (year-age 13)', async () => {
      const birthYear = new Date().getFullYear() - 13;
      await expect(service.createStudent('school-1', { displayName: 'Robin', username: 'robin1', password: 'hunter2!', birthYear, consentAttested: false }, 'admin-1'))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(mockFirestore.runTransaction).not.toHaveBeenCalled();
    });
  });

  describe('listRoster', () => {
    it('returns mapped students + loginCode + seats', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce({ id: 'school-1', loginCode: 'AB12CD', seatsUsed: 1, seatLimit: 30 });
      mockUsersRepo.findStudentsBySchool.mockResolvedValueOnce([
        { uid: 's-1', username: 'jsmith', displayName: 'Jamie', active: false },
        { uid: 's-2', username: 'alex01', displayName: 'Alex' },
      ]);
      const result = await service.listRoster('school-1');
      expect(result).toEqual({
        students: [
          { uid: 's-1', username: 'jsmith', displayName: 'Jamie', active: false },
          { uid: 's-2', username: 'alex01', displayName: 'Alex', active: true },
        ],
        loginCode: 'AB12CD',
        seatsUsed: 1,
        seatLimit: 30,
      });
    });

    it('throws NotFound for a missing school', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce(null);
      await expect(service.listRoster('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('setStudentActive', () => {
    it('deactivating disables login, flag, and frees a seat', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1' });
      const result = await service.setStudentActive('school-1', 's-1', false);
      expect(mockUpdateUser).toHaveBeenCalledWith('s-1', { disabled: true });
      expect(mockUsersRepo.setActive).toHaveBeenCalledWith('s-1', false);
      expect(mockSchoolsRepo.incrementSeatsUsed).toHaveBeenCalledWith('school-1', -1);
      expect(result).toEqual({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', active: false });
    });

    it('reactivating re-checks the seat limit then enables login', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1', active: false });
      seatSnap(5, 30, 'AB12CD');
      const result = await service.setStudentActive('school-1', 's-1', true);
      expect(mockTxn.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ seatsUsed: 6 }));
      expect(mockUpdateUser).toHaveBeenCalledWith('s-1', { disabled: false });
      expect(mockUsersRepo.setActive).toHaveBeenCalledWith('s-1', true);
      expect(result.active).toBe(true);
    });

    it('reactivating throws SEAT_LIMIT_REACHED when full (login untouched)', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1', active: false });
      seatSnap(30, 30, 'AB12CD');
      await expect(service.setStudentActive('school-1', 's-1', true)).rejects.toBeInstanceOf(ConflictException);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NotFound for a student in another school', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', role: 'child', schoolId: 'other' });
      await expect(service.setStudentActive('school-1', 's-1', false)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NotFound when the uid is not a child', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 't-1', role: 'teacher', schoolId: 'school-1' });
      await expect(service.setStudentActive('school-1', 't-1', false)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('is a no-op when deactivating an already-inactive student', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1', active: false });
      const result = await service.setStudentActive('school-1', 's-1', false);
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(mockSchoolsRepo.incrementSeatsUsed).not.toHaveBeenCalled();
      expect(result.active).toBe(false);
    });

    it('is a no-op when reactivating an already-active student', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 's-1', username: 'jsmith', displayName: 'Jamie', role: 'child', schoolId: 'school-1', active: true });
      const result = await service.setStudentActive('school-1', 's-1', true);
      expect(mockFirestore.runTransaction).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(result.active).toBe(true);
    });
  });
});
