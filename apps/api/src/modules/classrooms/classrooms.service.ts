import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { ProgressService } from '../progress/progress.service';
import { ContentModerationService } from '../ai/content-moderation.service';
import { ALL_MODULES } from '../modules/module-data';
import { getXpLevel } from '@eureka-lab/shared-types';
import type {
  ClassroomDocument,
  ClassroomSummary,
  ClassroomDetailView,
  StudentProgressSummary,
} from '@eureka-lab/shared-types';

/** Maximum number of classrooms a teacher may own */
const MAX_CLASSROOMS_PER_TEACHER = 10;

/** Maximum number of students in a classroom */
const DEFAULT_MAX_STUDENTS = 30;

/** Characters used for join code generation */
const JOIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Length of the join code */
const JOIN_CODE_LENGTH = 6;

/**
 * Service for managing teacher classrooms.
 * Firestore collection: classrooms/{classroomId}
 * CLAUDE.md Rule 3: All Firestore queries include userId filter.
 * CLAUDE.md Rule 12: Classroom names must pass moderation.
 * CLAUDE.md Rule 13: No child PII in external calls — names anonymized.
 */
@Injectable()
export class ClassroomsService {
  private readonly logger = new Logger(ClassroomsService.name);
  private readonly collectionName = 'classrooms';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly progressService: ProgressService,
    private readonly moderation: ContentModerationService,
  ) {}

  /**
   * Create a new classroom for a teacher.
   * Generates a unique 6-character join code.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param name - Classroom name (moderated)
   * @returns Created classroom document
   */
  async createClassroom(
    teacherId: string,
    name: string,
  ): Promise<ClassroomDocument> {
    /* Moderate classroom name */
    const nameCheck = this.moderation.moderateInput(name);
    if (!nameCheck.passed) {
      throw new BadRequestException(
        'Classroom name contains inappropriate content',
      );
    }

    /* Enforce classroom limit per teacher */
    const existingSnapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('teacherId', '==', teacherId)
      .count()
      .get();

    if (existingSnapshot.data().count >= MAX_CLASSROOMS_PER_TEACHER) {
      throw new BadRequestException(
        `Maximum of ${MAX_CLASSROOMS_PER_TEACHER} classrooms per teacher`,
      );
    }

    /* Generate unique join code */
    const joinCode = await this.generateUniqueJoinCode();

    /* Create classroom document */
    const docRef = this.firebase.firestore
      .collection(this.collectionName)
      .doc();

    const now = new Date().toISOString();
    const classroom: ClassroomDocument = {
      id: docRef.id,
      teacherId,
      name,
      joinCode,
      studentIds: [],
      maxStudents: DEFAULT_MAX_STUDENTS,
      createdAt: now,
    };

    await docRef.set(classroom);

    this.logger.log({
      event: 'classroom_created',
      teacherId,
      classroomId: classroom.id,
      joinCode,
    });

    return classroom;
  }

  /**
   * List all classrooms for a teacher.
   *
   * @param teacherId - Teacher's Firebase UID
   * @returns Array of classroom summaries
   */
  async getTeacherClassrooms(
    teacherId: string,
  ): Promise<ClassroomSummary[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('teacherId', '==', teacherId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ClassroomDocument;
      return {
        id: data.id,
        name: data.name,
        joinCode: data.joinCode,
        studentCount: data.studentIds.length,
        createdAt: data.createdAt,
      };
    });
  }

  /**
   * Get full classroom detail with per-student progress.
   * CLAUDE.md Rule 13: Student names are anonymized (first name only).
   *
   * @param teacherId - Teacher's Firebase UID
   * @param classroomId - Classroom document ID
   * @returns Classroom detail with student progress summaries
   */
  async getClassroomDetail(
    teacherId: string,
    classroomId: string,
  ): Promise<ClassroomDetailView> {
    const classroom = await this.getOwnedClassroom(teacherId, classroomId);

    /* Fetch progress for each student */
    const students: StudentProgressSummary[] = await Promise.all(
      classroom.studentIds.map((uid) => this.buildStudentSummary(uid)),
    );

    return { classroom, students };
  }

  /**
   * Join a classroom using a join code.
   *
   * @param studentId - Student's (child) Firebase UID
   * @param joinCode - 6-character join code
   * @returns The classroom the student joined
   */
  async joinClassroom(
    studentId: string,
    joinCode: string,
  ): Promise<ClassroomDocument> {
    /* Find classroom by join code */
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('joinCode', '==', joinCode.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException('Invalid join code');
    }

    const doc = snapshot.docs[0];
    const classroom = doc.data() as ClassroomDocument;

    /* Check if student is already a member */
    if (classroom.studentIds.includes(studentId)) {
      throw new BadRequestException('Already a member of this classroom');
    }

    /* Check max students */
    if (classroom.studentIds.length >= classroom.maxStudents) {
      throw new BadRequestException('Classroom is full');
    }

    /* Add student to classroom */
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collectionName)
      .doc(classroom.id)
      .update({
        studentIds: FieldValue.arrayUnion(studentId),
      });

    /* Add classroom to student's classroomIds */
    await this.firebase.firestore
      .collection('users')
      .doc(studentId)
      .update({
        classroomIds: FieldValue.arrayUnion(classroom.id),
      });

    this.logger.log({
      event: 'student_joined_classroom',
      studentId,
      classroomId: classroom.id,
    });

    return {
      ...classroom,
      studentIds: [...classroom.studentIds, studentId],
    };
  }

  /**
   * Remove a student from a classroom.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param classroomId - Classroom document ID
   * @param studentId - Student UID to remove
   */
  async removeStudent(
    teacherId: string,
    classroomId: string,
    studentId: string,
  ): Promise<void> {
    const classroom = await this.getOwnedClassroom(teacherId, classroomId);

    if (!classroom.studentIds.includes(studentId)) {
      throw new NotFoundException('Student not found in classroom');
    }

    const { FieldValue } = await import('firebase-admin/firestore');

    /* Remove student from classroom */
    await this.firebase.firestore
      .collection(this.collectionName)
      .doc(classroomId)
      .update({
        studentIds: FieldValue.arrayRemove(studentId),
      });

    /* Remove classroom from student */
    await this.firebase.firestore
      .collection('users')
      .doc(studentId)
      .update({
        classroomIds: FieldValue.arrayRemove(classroomId),
      });

    this.logger.log({
      event: 'student_removed',
      teacherId,
      classroomId,
      studentId,
    });
  }

  /**
   * Delete a classroom entirely.
   * Removes the classroomId from all enrolled students.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param classroomId - Classroom document ID
   */
  async deleteClassroom(
    teacherId: string,
    classroomId: string,
  ): Promise<void> {
    const classroom = await this.getOwnedClassroom(teacherId, classroomId);

    /* Remove classroom from all students */
    if (classroom.studentIds.length > 0) {
      const { FieldValue } = await import('firebase-admin/firestore');
      const batch = this.firebase.firestore.batch();

      for (const studentId of classroom.studentIds) {
        const studentRef = this.firebase.firestore
          .collection('users')
          .doc(studentId);
        batch.update(studentRef, {
          classroomIds: FieldValue.arrayRemove(classroomId),
        });
      }

      await batch.commit();
    }

    /* Delete classroom document */
    await this.firebase.firestore
      .collection(this.collectionName)
      .doc(classroomId)
      .delete();

    this.logger.log({
      event: 'classroom_deleted',
      teacherId,
      classroomId,
    });
  }

  /**
   * Regenerate the join code for a classroom.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param classroomId - Classroom document ID
   * @returns New join code
   */
  async regenerateJoinCode(
    teacherId: string,
    classroomId: string,
  ): Promise<string> {
    await this.getOwnedClassroom(teacherId, classroomId);

    const newCode = await this.generateUniqueJoinCode();

    await this.firebase.firestore
      .collection(this.collectionName)
      .doc(classroomId)
      .update({ joinCode: newCode });

    this.logger.log({
      event: 'join_code_regenerated',
      teacherId,
      classroomId,
      newCode,
    });

    return newCode;
  }

  /**
   * Fetch and verify a classroom belongs to the given teacher.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param classroomId - Classroom document ID
   * @returns Classroom document
   */
  private async getOwnedClassroom(
    teacherId: string,
    classroomId: string,
  ): Promise<ClassroomDocument> {
    const doc = await this.firebase.firestore
      .collection(this.collectionName)
      .doc(classroomId)
      .get();

    if (!doc.exists) {
      throw new NotFoundException(`Classroom ${classroomId} not found`);
    }

    const classroom = doc.data() as ClassroomDocument;

    if (classroom.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this classroom');
    }

    return classroom;
  }

  /**
   * Build a progress summary for a single student.
   * CLAUDE.md Rule 13: Anonymize name to first name only.
   *
   * @param studentId - Student's Firebase UID
   * @returns Student progress summary
   */
  private async buildStudentSummary(
    studentId: string,
  ): Promise<StudentProgressSummary> {
    const [userDoc, progressMap] = await Promise.all([
      this.usersRepository.findByUid(studentId),
      this.progressService.getAllProgress(studentId),
    ]);

    const displayName = userDoc
      ? userDoc.displayName.split(' ')[0]
      : 'Student';
    const xp = userDoc?.xp ?? 0;
    const streak = userDoc?.streak ?? 0;

    /* Count completed modules */
    let modulesCompleted = 0;
    for (const [, record] of progressMap) {
      if (record.completed) {
        modulesCompleted++;
      }
    }

    /* Determine last active date from progress records */
    let lastActiveDate = '';
    for (const [, record] of progressMap) {
      if (record.updatedAt > lastActiveDate) {
        lastActiveDate = record.updatedAt;
      }
    }

    return {
      uid: studentId,
      displayName,
      xp,
      level: getXpLevel(xp),
      streak,
      modulesCompleted,
      totalModules: ALL_MODULES.length,
      lastActiveDate: lastActiveDate || new Date().toISOString(),
    };
  }

  /**
   * Generate a unique 6-character alphanumeric join code.
   * Retries if the generated code already exists.
   *
   * @returns Unique join code
   */
  private async generateUniqueJoinCode(): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let code = '';
      for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
        const index = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
        code += JOIN_CODE_CHARS[index];
      }

      /* Check for uniqueness */
      const existing = await this.firebase.firestore
        .collection(this.collectionName)
        .where('joinCode', '==', code)
        .limit(1)
        .get();

      if (existing.empty) {
        return code;
      }
    }

    throw new BadRequestException(
      'Failed to generate unique join code. Please try again.',
    );
  }
}
