import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SchoolTeacherSummary } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { SchoolsRepository } from './schools.repository';
import { CreateTeacherDto } from './dto/create-teacher.dto';

/** Result of minting a teacher. */
export interface MintTeacherResult {
  uid: string;
  email: string;
  displayName: string;
  role: 'teacher';
  schoolId: string;
  active: boolean;
}

/**
 * School-admin teacher management. Callers are constrained to their own school
 * by TenantGuard at the controller; this service additionally verifies that a
 * targeted teacher belongs to the school before mutating it.
 */
@Injectable()
export class SchoolTeachersService {
  private readonly logger = new Logger(SchoolTeachersService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly schoolsRepository: SchoolsRepository,
  ) {}

  /**
   * Mint a teacher account linked to a school.
   * @param schoolId - Target school id.
   * @param dto - Teacher account data.
   * @returns The minted teacher summary.
   * @throws NotFoundException when the school does not exist.
   * @throws ConflictException when the email is already registered.
   */
  async createTeacher(schoolId: string, dto: CreateTeacherDto): Promise<MintTeacherResult> {
    const school = await this.schoolsRepository.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }

    let uid: string;
    try {
      const fbUser = await this.firebase.auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
      });
      uid = fbUser.uid;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      const code = (error as { code?: string }).code ?? '';
      if (msg.includes('email-already-exists') || code === 'auth/email-already-exists') {
        throw new ConflictException({ message: 'Email address is already registered', code: 'EMAIL_ALREADY_EXISTS' });
      }
      throw error;
    }

    await this.firebase.auth.setCustomUserClaims(uid, { role: 'teacher', schoolId });
    await this.usersRepository.create(uid, {
      email: dto.email,
      displayName: dto.displayName,
      role: 'teacher',
      schoolId,
      active: true,
    });

    this.logger.log({ event: 'teacher_minted', schoolId, uid });
    return { uid, email: dto.email, displayName: dto.displayName, role: 'teacher', schoolId, active: true };
  }

  /**
   * List a school's teachers as summaries (active defaults true).
   * @param schoolId - School id.
   * @returns Teacher summaries.
   */
  async listTeachers(schoolId: string): Promise<SchoolTeacherSummary[]> {
    const docs = await this.usersRepository.findTeachersBySchool(schoolId);
    return docs.map((d) => ({
      uid: d.uid,
      email: d.email,
      displayName: d.displayName,
      active: d.active ?? true,
    }));
  }

  /**
   * Activate or deactivate a teacher (Firebase disabled flag + user-doc flag).
   * @param schoolId - School id (must own the teacher).
   * @param teacherId - Teacher uid.
   * @param active - New active state.
   * @returns The updated teacher summary.
   * @throws NotFoundException when the uid is not a teacher of this school.
   */
  async setTeacherActive(schoolId: string, teacherId: string, active: boolean): Promise<SchoolTeacherSummary> {
    const teacher = await this.usersRepository.findByUid(teacherId);
    if (!teacher || teacher.role !== 'teacher' || teacher.schoolId !== schoolId) {
      throw new NotFoundException({ message: 'Teacher not found in this school', code: 'TEACHER_NOT_FOUND' });
    }
    await this.firebase.auth.updateUser(teacherId, { disabled: !active });
    await this.usersRepository.setActive(teacherId, active);
    this.logger.log({ event: 'teacher_active_changed', schoolId, teacherId, active });
    return { uid: teacher.uid, email: teacher.email, displayName: teacher.displayName, active };
  }
}
