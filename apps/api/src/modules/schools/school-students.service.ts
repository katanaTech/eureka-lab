import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { School, SchoolStudentSummary } from '@eureka-lab/shared-types';
import { synthesizeStudentEmail } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { SchoolsRepository } from './schools.repository';
import { CreateStudentDto } from './dto/create-student.dto';

/** Combined roster payload for the Students tab. */
export interface StudentRoster {
  students: SchoolStudentSummary[];
  loginCode: string;
  seatsUsed: number;
  seatLimit: number;
}

/** Year-age at or below which the COPPA school-consent attestation is required (conservative for year-only DOB). */
const CONSENT_AGE_THRESHOLD = 13;

/**
 * School-admin student management. TenantGuard scopes a school_admin to their
 * own school at the controller; this service additionally verifies a targeted
 * student belongs to the school, and keeps the seat counter accurate via a
 * transaction on the school doc.
 */
@Injectable()
export class SchoolStudentsService {
  private readonly logger = new Logger(SchoolStudentsService.name);
  private readonly auditCollection = 'schoolConsentAuditLog';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly schoolsRepository: SchoolsRepository,
  ) {}

  /**
   * Provision a seated student account under a school.
   * @param schoolId - Target school id.
   * @param dto - Student account data.
   * @param adminUid - Authenticated school_admin uid recorded on the consent audit row.
   * @returns The student summary.
   * @throws BadRequestException CONSENT_REQUIRED for under-13 without attestation.
   * @throws NotFoundException when the school does not exist.
   * @throws ConflictException SEAT_LIMIT_REACHED / USERNAME_TAKEN.
   */
  async createStudent(schoolId: string, dto: CreateStudentDto, adminUid: string): Promise<SchoolStudentSummary> {
    // Year-only DOB is conservative for COPPA: a child born `currentYear - 13`
    // may still be 12 until their birthday, so treat year-age 13-or-under as under-13.
    const age = new Date().getFullYear() - dto.birthYear;
    const requiresConsent = age <= CONSENT_AGE_THRESHOLD;
    if (requiresConsent && !dto.consentAttested) {
      throw new BadRequestException({ message: 'School consent is required for under-13 students', code: 'CONSENT_REQUIRED' });
    }

    const candidateCode = await this.schoolsRepository.generateUniqueLoginCode();
    const loginCode = await this.reserveSeat(schoolId, candidateCode);
    const email = synthesizeStudentEmail(loginCode, dto.username);

    let uid: string;
    try {
      const fbUser = await this.firebase.auth.createUser({ email, password: dto.password, displayName: dto.displayName });
      uid = fbUser.uid;
    } catch (error: unknown) {
      // Release the reserved seat; never let a release failure mask the real error.
      await this.schoolsRepository.incrementSeatsUsed(schoolId, -1).catch((releaseErr) => {
        this.logger.error({ event: 'seat_release_failed', schoolId, releaseErr });
      });
      const code = (error as { code?: string }).code ?? '';
      const msg = error instanceof Error ? error.message : '';
      if (code === 'auth/email-already-exists' || msg.includes('email-already-exists')) {
        throw new ConflictException({ message: 'Username is already taken in this school', code: 'USERNAME_TAKEN' });
      }
      throw error;
    }

    await this.firebase.auth.setCustomUserClaims(uid, { role: 'child', schoolId });
    await this.usersRepository.create(uid, {
      email,
      displayName: dto.displayName,
      role: 'child',
      schoolId,
      username: dto.username,
      birthYear: dto.birthYear,
      active: true,
    });

    if (requiresConsent) {
      await this.firebase.firestore.collection(this.auditCollection).doc().set({
        studentUid: uid,
        schoolId,
        adminUid,
        username: dto.username,
        birthYear: dto.birthYear,
        attestedAt: new Date().toISOString(),
      });
    }

    this.logger.log({ event: 'student_provisioned', schoolId, uid, underThirteen: requiresConsent });
    return { uid, username: dto.username, displayName: dto.displayName, active: true };
  }

  /**
   * List a school's students plus its login code and seat usage.
   * @param schoolId - School id.
   * @returns Roster payload.
   * @throws NotFoundException when the school is missing.
   */
  async listRoster(schoolId: string): Promise<StudentRoster> {
    const school = await this.schoolsRepository.findById(schoolId);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    const docs = await this.usersRepository.findStudentsBySchool(schoolId);
    const students = docs.map((d) => ({
      uid: d.uid,
      username: d.username ?? '',
      displayName: d.displayName,
      active: d.active ?? true,
    }));
    return { students, loginCode: school.loginCode ?? '', seatsUsed: school.seatsUsed, seatLimit: school.seatLimit };
  }

  /**
   * Activate or deactivate a student (Firebase disabled flag + user-doc flag +
   * seat accounting). Reactivation re-checks the seat limit.
   * @param schoolId - School id (must own the student).
   * @param studentId - Student uid.
   * @param active - New active state.
   * @returns The updated student summary.
   * @throws NotFoundException when the uid is not a child of this school.
   * @throws ConflictException SEAT_LIMIT_REACHED when reactivating a full school.
   */
  async setStudentActive(schoolId: string, studentId: string, active: boolean): Promise<SchoolStudentSummary> {
    const student = await this.usersRepository.findByUid(studentId);
    if (!student || student.role !== 'child' || student.schoolId !== schoolId) {
      throw new NotFoundException({ message: 'Student not found in this school', code: 'STUDENT_NOT_FOUND' });
    }

    const summary = { uid: student.uid, username: student.username ?? '', displayName: student.displayName, active };
    // Idempotent: if already in the target state, touch neither Firebase Auth nor the seat counter.
    if ((student.active ?? true) === active) {
      return summary;
    }

    if (active) {
      await this.reserveSeat(schoolId); // re-checks the seat limit; an existing student's school already has a loginCode
      try {
        await this.firebase.auth.updateUser(studentId, { disabled: false });
        await this.usersRepository.setActive(studentId, true);
      } catch (error) {
        await this.schoolsRepository.incrementSeatsUsed(schoolId, -1).catch((releaseErr) => {
          this.logger.error({ event: 'seat_release_failed', schoolId, releaseErr });
        });
        throw error;
      }
    } else {
      await this.firebase.auth.updateUser(studentId, { disabled: true });
      try {
        await this.usersRepository.setActive(studentId, false);
        await this.schoolsRepository.incrementSeatsUsed(schoolId, -1);
      } catch (error) {
        // Re-enable the account so it doesn't end up disabled-in-Auth but active-in-doc.
        await this.firebase.auth.updateUser(studentId, { disabled: false }).catch((rollbackErr) => {
          this.logger.error({ event: 'student_deactivate_rollback_failed', studentId, rollbackErr });
        });
        throw error;
      }
    }

    this.logger.log({ event: 'student_active_changed', schoolId, studentId, active });
    return summary;
  }

  /**
   * Reserve one seat on the school doc inside a transaction, lazily setting the
   * login code if absent.
   * @param schoolId - School id.
   * @param candidateLoginCode - Code to assign if the school has none yet (omit when the school is known to already have one).
   * @returns The school's effective login code.
   * @throws NotFoundException when the school is missing.
   * @throws ConflictException SEAT_LIMIT_REACHED at capacity.
   */
  private async reserveSeat(schoolId: string, candidateLoginCode?: string): Promise<string> {
    const ref = this.firebase.firestore.collection('schools').doc(schoolId);
    return this.firebase.firestore.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      if (!snap.exists) {
        throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
      }
      const school = snap.data() as School;
      if (school.seatsUsed >= school.seatLimit) {
        throw new ConflictException({ message: 'Seat limit reached', code: 'SEAT_LIMIT_REACHED' });
      }
      const loginCode = school.loginCode ?? candidateLoginCode;
      if (!loginCode) {
        throw new Error('Cannot reserve a seat for a school with no login code');
      }
      const update: Record<string, unknown> = { seatsUsed: school.seatsUsed + 1 };
      if (!school.loginCode) update.loginCode = loginCode;
      txn.update(ref, update);
      return loginCode;
    });
  }
}
