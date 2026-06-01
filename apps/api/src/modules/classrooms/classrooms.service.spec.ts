/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { ProgressService } from '../progress/progress.service';
import { ContentModerationService } from '../ai/content-moderation.service';

/* ── Mock plumbing ──────────────────────────────────────────────────── */
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockDocRef = {
  id: 'classroom-1',
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};

const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockCountGet = jest.fn();

const mockCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  count: jest.fn().mockReturnValue({ get: mockCountGet }),
};

const mockFirebaseService = {
  firestore: {
    collection: jest.fn().mockReturnValue(mockCollectionRef),
    batch: jest.fn().mockReturnValue({
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    }),
  },
};

const mockUsersRepository = {
  findByUid: jest.fn(),
  findStudentsBySchool: jest.fn(),
};

const mockProgressService = {
  getAllProgress: jest.fn(),
};

const mockModeration = {
  moderateInput: jest.fn(),
  moderateOutput: jest.fn(),
};

/* ── Fixtures ───────────────────────────────────────────────────────── */
const teacherId = 'teacher-uid-1';
const classroomId = 'classroom-1';

const classroomData = {
  id: classroomId,
  teacherId,
  name: 'Math 101',
  joinCode: 'ABC123',
  studentIds: ['student-1', 'student-2'],
  maxStudents: 30,
  createdAt: '2026-01-01T00:00:00.000Z',
};

/* ── Test suite ─────────────────────────────────────────────────────── */
describe('ClassroomsService', () => {
  let service: ClassroomsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassroomsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: ContentModerationService, useValue: mockModeration },
      ],
    }).compile();

    service = module.get<ClassroomsService>(ClassroomsService);

    /* Default happy-path mocks */
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockModeration.moderateInput.mockReturnValue({ passed: true, flags: [] });
    mockCountGet.mockResolvedValue({ data: () => ({ count: 0 }) });

    /* Chain helpers for where/orderBy/limit */
    mockWhere.mockReturnValue({
      count: jest.fn().mockReturnValue({ get: mockCountGet }),
      limit: mockLimit,
      orderBy: mockOrderBy,
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    });
    mockOrderBy.mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    });
    mockLimit.mockReturnValue({
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    });
  });

  /* ── createClassroom ─────────────────────────────────────────────── */
  describe('createClassroom', () => {
    it('should create a classroom and return the document', async () => {
      const result = await service.createClassroom(teacherId, 'Math 101');

      expect(result).toMatchObject({
        id: 'classroom-1',
        teacherId,
        name: 'Math 101',
        joinCode: expect.any(String),
        studentIds: [],
        maxStudents: 30,
      });
      expect(mockSet).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if name fails moderation', async () => {
      mockModeration.moderateInput.mockReturnValue({
        passed: false,
        flags: ['inappropriate'],
      });

      await expect(
        service.createClassroom(teacherId, 'Bad Name'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if teacher has 10 classrooms', async () => {
      mockCountGet.mockResolvedValue({ data: () => ({ count: 10 }) });

      /* Re-configure the where chain for the count check */
      mockWhere.mockReturnValue({
        count: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ data: () => ({ count: 10 }) }),
        }),
        limit: mockLimit,
        orderBy: mockOrderBy,
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      });

      await expect(
        service.createClassroom(teacherId, 'Extra Class'),
      ).rejects.toThrow(BadRequestException);
    });

    it('stamps schoolId on the created classroom when provided', async () => {
      const created = await service.createClassroom(teacherId, 'Math 101', 'school-7');
      expect(created.schoolId).toBe('school-7');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school-7' }),
      );
    });

    it('omits schoolId for a B2C teacher (no schoolId arg)', async () => {
      const created = await service.createClassroom(teacherId, 'Math 101');
      expect(created.schoolId).toBeUndefined();
      expect(mockSet).toHaveBeenCalledWith(
        expect.not.objectContaining({ schoolId: expect.anything() }),
      );
    });
  });

  /* ── getTeacherClassrooms ────────────────────────────────────────── */
  describe('getTeacherClassrooms', () => {
    it('should return classroom summaries for the teacher', async () => {
      mockWhere.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [{ data: () => classroomData }],
          }),
        }),
        count: jest.fn().mockReturnValue({ get: mockCountGet }),
        limit: mockLimit,
        get: jest.fn(),
      });

      const result = await service.getTeacherClassrooms(teacherId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: classroomId,
        name: 'Math 101',
        joinCode: 'ABC123',
        studentCount: 2,
      });
    });

    it('should return empty array when teacher has no classrooms', async () => {
      mockWhere.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
        count: jest.fn().mockReturnValue({ get: mockCountGet }),
        limit: mockLimit,
        get: jest.fn(),
      });

      const result = await service.getTeacherClassrooms(teacherId);

      expect(result).toEqual([]);
    });
  });

  /* ── getClassroomDetail ──────────────────────────────────────────── */
  describe('getClassroomDetail', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => classroomData,
      });

      mockUsersRepository.findByUid.mockImplementation((uid: string) => ({
        uid,
        displayName: uid === 'student-1' ? 'Alice Johnson' : 'Bob Smith',
        xp: 500,
        streak: 3,
      }));

      mockProgressService.getAllProgress.mockResolvedValue(
        new Map([
          [
            'mod-1',
            {
              completed: true,
              updatedAt: '2026-02-15T00:00:00.000Z',
            },
          ],
        ]),
      );
    });

    it('should return classroom detail with student summaries', async () => {
      const result = await service.getClassroomDetail(teacherId, classroomId);

      expect(result.classroom).toMatchObject({ id: classroomId, teacherId });
      expect(result.students).toHaveLength(2);
    });

    it('should anonymize student names to first name only', async () => {
      const result = await service.getClassroomDetail(teacherId, classroomId);

      const names = result.students.map(
        (s: { displayName: string }) => s.displayName,
      );
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
      expect(names).not.toContain('Alice Johnson');
      expect(names).not.toContain('Bob Smith');
    });

    it('should throw ForbiddenException if teacher does not own classroom', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...classroomData, teacherId: 'other-teacher' }),
      });

      await expect(
        service.getClassroomDetail(teacherId, classroomId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if classroom does not exist', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.getClassroomDetail(teacherId, classroomId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ── joinClassroom ───────────────────────────────────────────────── */
  describe('joinClassroom', () => {
    const studentId = 'student-new';

    beforeEach(() => {
      /* Default: find classroom by join code */
      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [{ data: () => classroomData }],
          }),
        }),
        count: jest.fn().mockReturnValue({ get: mockCountGet }),
        orderBy: mockOrderBy,
        get: jest.fn(),
      });
    });

    it('should add student to classroom and return updated doc', async () => {
      const result = await service.joinClassroom(studentId, 'ABC123');

      expect(result.studentIds).toContain(studentId);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid join code', async () => {
      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
        }),
        count: jest.fn().mockReturnValue({ get: mockCountGet }),
        orderBy: mockOrderBy,
        get: jest.fn(),
      });

      await expect(
        service.joinClassroom(studentId, 'XXXXXX'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if student already enrolled', async () => {
      await expect(
        service.joinClassroom('student-1', 'ABC123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if classroom is full', async () => {
      const fullClassroom = {
        ...classroomData,
        studentIds: Array(30).fill('s'),
        maxStudents: 30,
      };
      mockWhere.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [{ data: () => fullClassroom }],
          }),
        }),
        count: jest.fn().mockReturnValue({ get: mockCountGet }),
        orderBy: mockOrderBy,
        get: jest.fn(),
      });

      await expect(
        service.joinClassroom(studentId, 'ABC123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ── joinClassroom tenancy ───────────────────────────────────────── */
  describe('joinClassroom tenancy', () => {
    const baseClass = {
      id: classroomId,
      teacherId,
      name: 'Math 101',
      joinCode: 'ABC123',
      studentIds: [],
      maxStudents: 30,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    /** Make the join-code lookup resolve to the given classroom doc. */
    const stubCodeLookup = (classroom: Record<string, unknown>) => {
      mockWhere.mockReturnValueOnce({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false, docs: [{ data: () => classroom }] }),
        }),
        count: jest.fn().mockReturnValue({ get: mockCountGet }),
        orderBy: mockOrderBy,
        get: jest.fn(),
      });
    };

    it('rejects a cross-school child with CROSS_SCHOOL_JOIN', async () => {
      stubCodeLookup({ ...baseClass, schoolId: 'school-7' });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'child-x', role: 'child', schoolId: 'other-school' });
      await expect(service.joinClassroom('child-x', 'ABC123')).rejects.toMatchObject({
        response: { code: 'CROSS_SCHOOL_JOIN' },
      });
    });

    it('lets a same-school child join a school classroom', async () => {
      stubCodeLookup({ ...baseClass, schoolId: 'school-7' });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'child-y', role: 'child', schoolId: 'school-7' });
      const res = await service.joinClassroom('child-y', 'ABC123');
      expect(res.studentIds).toContain('child-y');
    });

    it('leaves B2C self-join unaffected (no schoolId on class)', async () => {
      stubCodeLookup({ ...baseClass });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'child-z', role: 'child' });
      const res = await service.joinClassroom('child-z', 'ABC123');
      expect(res.studentIds).toContain('child-z');
    });

    it('rejects a same-school non-child (e.g. teacher) with CROSS_SCHOOL_JOIN', async () => {
      stubCodeLookup({ ...baseClass, schoolId: 'school-7' });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ uid: 'teacher-x', role: 'teacher', schoolId: 'school-7' });
      await expect(service.joinClassroom('teacher-x', 'ABC123')).rejects.toMatchObject({
        response: { code: 'CROSS_SCHOOL_JOIN' },
      });
    });
  });

  /* ── assignStudents ──────────────────────────────────────────────── */
  describe('assignStudents', () => {
    beforeEach(() => {
      /* Reset findByUid so the getClassroomDetail mockImplementation doesn't bleed in. */
      mockUsersRepository.findByUid.mockReset();
    });

    const schoolClassroom = {
      id: classroomId,
      teacherId,
      name: 'Math 101',
      joinCode: 'ABC123',
      schoolId: 'school-7',
      studentIds: ['existing-1'],
      maxStudents: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const childInSchool = (uid: string) => ({
      uid,
      role: 'child',
      schoolId: 'school-7',
      active: true,
      displayName: 'Kid',
    });

    it('adds same-school active children and returns the updated doc', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid
        .mockResolvedValueOnce(childInSchool('new-1'))
        .mockResolvedValueOnce(childInSchool('new-2'));
      const batchUpdate = jest.fn();
      const batchCommit = jest.fn().mockResolvedValue(undefined);
      mockFirebaseService.firestore.batch.mockReturnValueOnce({ update: batchUpdate, commit: batchCommit });

      const result = await service.assignStudents(teacherId, classroomId, ['new-1', 'new-2']);

      expect(result.studentIds).toEqual(['existing-1', 'new-1', 'new-2']);
      expect(batchUpdate).toHaveBeenCalledTimes(3);
      expect(batchCommit).toHaveBeenCalledTimes(1);
    });

    it('dedupes students already enrolled', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce(childInSchool('new-1'));
      const batchUpdate = jest.fn();
      const batchCommit = jest.fn().mockResolvedValue(undefined);
      mockFirebaseService.firestore.batch.mockReturnValueOnce({ update: batchUpdate, commit: batchCommit });

      const result = await service.assignStudents(teacherId, classroomId, ['existing-1', 'new-1']);

      expect(result.studentIds).toEqual(['existing-1', 'new-1']);
      expect(batchUpdate).toHaveBeenCalledTimes(2);
    });

    it('rejects a non-owner teacher (ForbiddenException)', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ ...schoolClassroom, teacherId: 'someone-else' }) });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toThrow(ForbiddenException);
    });

    it('rejects a B2C classroom with NOT_A_SCHOOL_CLASSROOM', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ ...schoolClassroom, schoolId: undefined }) });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toMatchObject({
        response: { code: 'NOT_A_SCHOOL_CLASSROOM' },
      });
    });

    it('rejects a student from another school with STUDENT_NOT_IN_SCHOOL', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ ...childInSchool('new-1'), schoolId: 'other-school' });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toMatchObject({
        response: { code: 'STUDENT_NOT_IN_SCHOOL' },
      });
    });

    it('rejects a non-child / inactive user with STUDENT_NOT_IN_SCHOOL', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce({ ...childInSchool('new-1'), active: false });
      await expect(service.assignStudents(teacherId, classroomId, ['new-1'])).rejects.toMatchObject({
        response: { code: 'STUDENT_NOT_IN_SCHOOL' },
      });
    });

    it('enforces maxStudents with CLASSROOM_FULL (net-new count)', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid
        .mockResolvedValueOnce(childInSchool('n1'))
        .mockResolvedValueOnce(childInSchool('n2'))
        .mockResolvedValueOnce(childInSchool('n3'));
      await expect(service.assignStudents(teacherId, classroomId, ['n1', 'n2', 'n3'])).rejects.toMatchObject({
        response: { code: 'CLASSROOM_FULL' },
      });
    });

    it('rejects a non-existent UID with STUDENT_NOT_IN_SCHOOL', async () => {
      mockGet.mockResolvedValueOnce({ exists: true, data: () => schoolClassroom });
      mockUsersRepository.findByUid.mockResolvedValueOnce(null);
      await expect(service.assignStudents(teacherId, classroomId, ['ghost-uid'])).rejects.toMatchObject({
        response: { code: 'STUDENT_NOT_IN_SCHOOL' },
      });
    });
  });

  /* ── removeStudent ───────────────────────────────────────────────── */
  describe('removeStudent', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => classroomData,
      });
    });

    it('should remove student from classroom', async () => {
      await service.removeStudent(teacherId, classroomId, 'student-1');

      /* update called for both classroom doc and student doc */
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if student not in classroom', async () => {
      await expect(
        service.removeStudent(teacherId, classroomId, 'unknown-student'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-owner tries to remove', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...classroomData, teacherId: 'other-teacher' }),
      });

      await expect(
        service.removeStudent(teacherId, classroomId, 'student-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /* ── deleteClassroom ─────────────────────────────────────────────── */
  describe('deleteClassroom', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => classroomData,
      });
    });

    it('should delete classroom and clean up student references', async () => {
      await service.deleteClassroom(teacherId, classroomId);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(
        mockFirebaseService.firestore.batch().commit,
      ).toHaveBeenCalledTimes(1);
    });

    it('should skip batch commit if classroom has no students', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...classroomData, studentIds: [] }),
      });

      await service.deleteClassroom(teacherId, classroomId);

      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for non-existent classroom', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.deleteClassroom(teacherId, classroomId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ── regenerateJoinCode ──────────────────────────────────────────── */
  describe('regenerateJoinCode', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => classroomData,
      });
    });

    it('should return a new 6-character alphanumeric code', async () => {
      const newCode = await service.regenerateJoinCode(
        teacherId,
        classroomId,
      );

      expect(newCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException if teacher does not own classroom', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ ...classroomData, teacherId: 'other-teacher' }),
      });

      await expect(
        service.regenerateJoinCode(teacherId, classroomId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /* ── getSchoolRoster ─────────────────────────────────────────────── */
  describe('getSchoolRoster', () => {
    it('returns the school active students as summaries', async () => {
      mockUsersRepository.findStudentsBySchool.mockResolvedValueOnce([
        { uid: 's1', username: 'kid1', displayName: 'Kid One', active: true },
        { uid: 's2', username: 'kid2', displayName: 'Kid Two', active: false },
        { uid: 's3', username: 'kid3', displayName: 'Kid Three' },
      ]);
      const res = await service.getSchoolRoster('school-7');
      expect(res.map((s) => s.uid)).toEqual(['s1', 's3']);
      expect(res[0]).toEqual({ uid: 's1', username: 'kid1', displayName: 'Kid One', active: true });
    });

    it('returns an empty list for a school-less (B2C) teacher', async () => {
      const res = await service.getSchoolRoster(undefined);
      expect(res).toEqual([]);
    });
  });
});
