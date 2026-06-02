import { Injectable, Logger } from '@nestjs/common';
import type { ClassroomDocument, SchoolClassroomSummary } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Read-only rollup of a school's classrooms for the school-admin console.
 * Scoped by the denormalized classrooms.schoolId (ADR-008), resolving each
 * classroom's owning teacher name and current student count.
 */
@Injectable()
export class SchoolClassroomsService {
  private readonly logger = new Logger(SchoolClassroomsService.name);
  private readonly collectionName = 'classrooms';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
  ) {}

  /**
   * List all classrooms owned by a school as resolved summaries.
   * @param schoolId - School tenant id.
   * @returns Classroom summaries (name, teacher name, student count).
   */
  async listSchoolClassrooms(schoolId: string): Promise<SchoolClassroomSummary[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('schoolId', '==', schoolId)
      .get();

    const classrooms = snapshot.docs.map((d) => d.data() as ClassroomDocument);

    this.logger.log({ event: 'classrooms_rollup_fetched', schoolId, count: classrooms.length });

    // Teacher lookups fan out one read per classroom (concurrent, not deduped).
    // At pilot-school scale this is acceptable; dedupe by teacherId if it grows.
    return Promise.all(
      classrooms.map(async (c) => {
        const teacher = await this.usersRepository.findByUid(c.teacherId);
        return {
          id: c.id,
          name: c.name,
          teacherName: teacher?.displayName ?? 'Unknown teacher',
          studentCount: c.studentIds.length,
        };
      }),
    );
  }
}
