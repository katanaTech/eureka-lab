/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ClassroomsController } from './classrooms.controller';
import { ClassroomsService } from './classrooms.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { ClassroomDocument, ClassroomDetailView } from '@eureka-lab/shared-types';

/* ── Mock service ───────────────────────────────────────────────────── */
const mockClassroomsService = {
  createClassroom: jest.fn(),
  getTeacherClassrooms: jest.fn(),
  getClassroomDetail: jest.fn(),
  joinClassroom: jest.fn(),
  removeStudent: jest.fn(),
  deleteClassroom: jest.fn(),
  regenerateJoinCode: jest.fn(),
  assignStudents: jest.fn(),
  getSchoolRoster: jest.fn(),
};

const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

/* ── Fixtures ───────────────────────────────────────────────────────── */
const teacherUser: AuthenticatedUser = {
  uid: 'teacher-1',
  email: 'teacher@test.com',
  role: 'teacher',
};

const childUser: AuthenticatedUser = {
  uid: 'student-1',
  email: 'student@test.com',
  role: 'child',
};

const classroomDoc: ClassroomDocument = {
  id: 'classroom-1',
  teacherId: 'teacher-1',
  name: 'Math 101',
  joinCode: 'ABC123',
  studentIds: [],
  maxStudents: 30,
  createdAt: '2026-01-01T00:00:00.000Z',
};

/* ── Test suite ─────────────────────────────────────────────────────── */
describe('ClassroomsController', () => {
  let controller: ClassroomsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassroomsController],
      providers: [
        { provide: ClassroomsService, useValue: mockClassroomsService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<ClassroomsController>(ClassroomsController);
  });

  /* ── createClassroom ─────────────────────────────────────────────── */
  describe('createClassroom', () => {
    it('should call service and return created classroom', async () => {
      mockClassroomsService.createClassroom.mockResolvedValue(classroomDoc);

      const result = await controller.createClassroom(teacherUser, {
        name: 'Math 101',
      });

      expect(result).toEqual(classroomDoc);
      expect(mockClassroomsService.createClassroom).toHaveBeenCalledWith(
        'teacher-1',
        'Math 101',
        undefined,
      );
    });

    it('createClassroom threads schoolId from the user token to the service', async () => {
      mockClassroomsService.createClassroom.mockResolvedValueOnce({ id: 'c1' });
      const user = { uid: 'teacher-1', email: 't@s.edu', role: 'teacher', schoolId: 'school-7' } as AuthenticatedUser;
      await controller.createClassroom(user, { name: 'Math 101' });
      expect(mockClassroomsService.createClassroom).toHaveBeenCalledWith('teacher-1', 'Math 101', 'school-7');
    });
  });

  /* ── listClassrooms ──────────────────────────────────────────────── */
  describe('listClassrooms', () => {
    it('should return classrooms wrapped in object', async () => {
      const summaries = [
        {
          id: 'classroom-1',
          name: 'Math 101',
          joinCode: 'ABC123',
          studentCount: 5,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      mockClassroomsService.getTeacherClassrooms.mockResolvedValue(summaries);

      const result = await controller.listClassrooms(teacherUser);

      expect(result).toEqual({ classrooms: summaries });
      expect(
        mockClassroomsService.getTeacherClassrooms,
      ).toHaveBeenCalledWith('teacher-1');
    });
  });

  /* ── getClassroomDetail ──────────────────────────────────────────── */
  describe('getClassroomDetail', () => {
    it('should return classroom detail with students', async () => {
      const detail: ClassroomDetailView = {
        classroom: classroomDoc,
        students: [],
      };
      mockClassroomsService.getClassroomDetail.mockResolvedValue(detail);

      const result = await controller.getClassroomDetail(
        teacherUser,
        'classroom-1',
      );

      expect(result).toEqual(detail);
      expect(
        mockClassroomsService.getClassroomDetail,
      ).toHaveBeenCalledWith('teacher-1', 'classroom-1');
    });
  });

  /* ── joinClassroom ───────────────────────────────────────────────── */
  describe('joinClassroom', () => {
    it('should call service with student uid and join code', async () => {
      mockClassroomsService.joinClassroom.mockResolvedValue(classroomDoc);

      const result = await controller.joinClassroom(childUser, {
        joinCode: 'ABC123',
      });

      expect(result).toEqual(classroomDoc);
      expect(mockClassroomsService.joinClassroom).toHaveBeenCalledWith(
        'student-1',
        'ABC123',
      );
    });
  });

  /* ── removeStudent ───────────────────────────────────────────────── */
  describe('removeStudent', () => {
    it('should call service to remove student', async () => {
      mockClassroomsService.removeStudent.mockResolvedValue(undefined);

      await controller.removeStudent(
        teacherUser,
        'classroom-1',
        'student-1',
      );

      expect(mockClassroomsService.removeStudent).toHaveBeenCalledWith(
        'teacher-1',
        'classroom-1',
        'student-1',
      );
    });
  });

  /* ── deleteClassroom ─────────────────────────────────────────────── */
  describe('deleteClassroom', () => {
    it('should call service to delete classroom', async () => {
      mockClassroomsService.deleteClassroom.mockResolvedValue(undefined);

      await controller.deleteClassroom(teacherUser, 'classroom-1');

      expect(mockClassroomsService.deleteClassroom).toHaveBeenCalledWith(
        'teacher-1',
        'classroom-1',
      );
    });
  });

  /* ── regenerateJoinCode ──────────────────────────────────────────── */
  describe('regenerateJoinCode', () => {
    it('should return new join code wrapped in object', async () => {
      mockClassroomsService.regenerateJoinCode.mockResolvedValue('XYZ789');

      const result = await controller.regenerateJoinCode(
        teacherUser,
        'classroom-1',
      );

      expect(result).toEqual({ joinCode: 'XYZ789' });
      expect(
        mockClassroomsService.regenerateJoinCode,
      ).toHaveBeenCalledWith('teacher-1', 'classroom-1');
    });
  });

  /* ── assignStudents ──────────────────────────────────────────────── */
  describe('assignStudents', () => {
    it('assignStudents delegates uid + id + studentIds', async () => {
      mockClassroomsService.assignStudents.mockResolvedValueOnce({ id: 'c1', studentIds: ['s1'] });
      const user = { uid: 'teacher-1', email: 't@s.edu', role: 'teacher', schoolId: 'school-7' } as AuthenticatedUser;
      const res = await controller.assignStudents(user, 'c1', { studentIds: ['s1'] });
      expect(res).toEqual({ id: 'c1', studentIds: ['s1'] });
      expect(mockClassroomsService.assignStudents).toHaveBeenCalledWith('teacher-1', 'c1', ['s1']);
    });
  });

  /* ── getRoster ───────────────────────────────────────────────────── */
  describe('getRoster', () => {
    it('getRoster returns the school roster for the caller-teacher', async () => {
      mockClassroomsService.getSchoolRoster.mockResolvedValueOnce([{ uid: 's1', username: 'k', displayName: 'K', active: true }]);
      const user = { uid: 'teacher-1', email: 't@s.edu', role: 'teacher', schoolId: 'school-7' } as AuthenticatedUser;
      const res = await controller.getRoster(user);
      expect(res).toEqual({ students: [{ uid: 's1', username: 'k', displayName: 'K', active: true }] });
      expect(mockClassroomsService.getSchoolRoster).toHaveBeenCalledWith('school-7');
    });
  });
});
