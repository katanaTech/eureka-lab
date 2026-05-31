import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SchoolTeachersService } from './school-teachers.service';
import { SchoolsRepository } from './schools.repository';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockCreateUser = jest.fn();
const mockSetClaims = jest.fn().mockResolvedValue(undefined);
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);
const mockFirebase = { auth: { createUser: mockCreateUser, setCustomUserClaims: mockSetClaims, updateUser: mockUpdateUser } };
const mockUsersRepo = { create: jest.fn().mockResolvedValue(undefined), findByUid: jest.fn(), findTeachersBySchool: jest.fn(), setActive: jest.fn().mockResolvedValue(undefined) };
const mockSchoolsRepo = { findById: jest.fn() };

describe('SchoolTeachersService', () => {
  let service: SchoolTeachersService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolTeachersService,
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: SchoolsRepository, useValue: mockSchoolsRepo },
      ],
    }).compile();
    service = moduleRef.get(SchoolTeachersService);
  });

  describe('createTeacher', () => {
    it('mints a teacher with school claims + active flag', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockResolvedValueOnce({ uid: 't-9' });
      const result = await service.createTeacher('school-1', { email: 't@s.edu', displayName: 'T', password: 'Passw0rd' });
      expect(mockSetClaims).toHaveBeenCalledWith('t-9', { role: 'teacher', schoolId: 'school-1' });
      expect(mockUsersRepo.create).toHaveBeenCalledWith('t-9', { email: 't@s.edu', displayName: 'T', role: 'teacher', schoolId: 'school-1', active: true });
      expect(result).toEqual({ uid: 't-9', email: 't@s.edu', displayName: 'T', role: 'teacher', schoolId: 'school-1', active: true });
    });

    it('throws NotFound when the school is missing', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce(null);
      await expect(service.createTeacher('nope', { email: 't@s.edu', displayName: 'T', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(NotFoundException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('maps duplicate email to ConflictException', async () => {
      mockSchoolsRepo.findById.mockResolvedValueOnce({ id: 'school-1' });
      mockCreateUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
      await expect(service.createTeacher('school-1', { email: 'dupe@s.edu', displayName: 'T', password: 'Passw0rd' }))
        .rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('listTeachers', () => {
    it('maps docs to summaries, defaulting active to true', async () => {
      mockUsersRepo.findTeachersBySchool.mockResolvedValueOnce([
        { uid: 't-1', email: 'a@s.edu', displayName: 'A', active: false },
        { uid: 't-2', email: 'b@s.edu', displayName: 'B' },
      ]);
      const result = await service.listTeachers('school-1');
      expect(result).toEqual([
        { uid: 't-1', email: 'a@s.edu', displayName: 'A', active: false },
        { uid: 't-2', email: 'b@s.edu', displayName: 'B', active: true },
      ]);
    });
  });

  describe('setTeacherActive', () => {
    it('disables login + flag when deactivating', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 't-1', email: 'a@s.edu', displayName: 'A', role: 'teacher', schoolId: 'school-1' });
      const result = await service.setTeacherActive('school-1', 't-1', false);
      expect(mockUpdateUser).toHaveBeenCalledWith('t-1', { disabled: true });
      expect(mockUsersRepo.setActive).toHaveBeenCalledWith('t-1', false);
      expect(result).toEqual({ uid: 't-1', email: 'a@s.edu', displayName: 'A', active: false });
    });

    it('throws NotFound for a teacher in another school', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 't-1', role: 'teacher', schoolId: 'other' });
      await expect(service.setTeacherActive('school-1', 't-1', false)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('throws NotFound when the uid is not a teacher', async () => {
      mockUsersRepo.findByUid.mockResolvedValueOnce({ uid: 'x', role: 'parent' });
      await expect(service.setTeacherActive('school-1', 'x', true)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
