import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { School, SchoolSummary, SchoolAdminSummary } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { ContentModerationService } from '../ai/content-moderation.service';
import { SchoolsRepository } from './schools.repository';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

/** Result of minting a school_admin. */
export interface MintSchoolAdminResult {
  uid: string;
  email: string;
  displayName: string;
  role: 'school_admin';
  schoolId: string;
}

/**
 * Business logic for school tenants. All callers are super_admin (enforced at
 * the controller). School accounts are minted, never age-derived.
 */
@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    private readonly repo: SchoolsRepository,
    private readonly firebase: FirebaseService,
    private readonly usersRepository: UsersRepository,
    private readonly moderation: ContentModerationService,
  ) {}

  /**
   * Create a new school tenant.
   * @param creatorUid - super_admin uid creating the school.
   * @param dto - School creation data.
   * @returns The created school document.
   * @throws BadRequestException when the name fails moderation.
   */
  async createSchool(creatorUid: string, dto: CreateSchoolDto): Promise<School> {
    const nameCheck = this.moderation.moderateInput(dto.name);
    if (!nameCheck.passed) {
      throw new BadRequestException({
        message: 'School name contains inappropriate content',
        code: 'NAME_REJECTED',
      });
    }

    const school: School = {
      id: this.repo.newId(),
      name: dto.name,
      status: 'active',
      seatLimit: dto.seatLimit,
      seatsUsed: 0,
      adminUids: [],
      subscription: { tier: dto.subscriptionTier ?? 'trial', status: 'active' },
      secretKeys: { enrollmentSecret: this.generateEnrollmentSecret() },
      createdAt: Date.now(),
      createdBy: creatorUid,
    };

    await this.repo.createSchool(school);
    this.logger.log({ event: 'school_created', schoolId: school.id, createdBy: creatorUid });
    return school;
  }

  /**
   * Mint the first school_admin for a school (mirrors AuthService.addChild).
   * @param schoolId - Target school id.
   * @param dto - Admin account data.
   * @returns The minted admin summary.
   * @throws NotFoundException when the school does not exist.
   * @throws ConflictException when the email is already registered.
   */
  async mintSchoolAdmin(
    schoolId: string,
    dto: CreateSchoolAdminDto,
  ): Promise<MintSchoolAdminResult> {
    const school = await this.repo.findById(schoolId);
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
        throw new ConflictException({
          message: 'Email address is already registered',
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }
      throw error;
    }

    await this.firebase.auth.setCustomUserClaims(uid, { role: 'school_admin', schoolId });
    await this.usersRepository.create(uid, {
      email: dto.email,
      displayName: dto.displayName,
      role: 'school_admin',
      schoolId,
    });
    await this.repo.addAdminUid(schoolId, uid);

    this.logger.log({ event: 'school_admin_minted', schoolId, uid });
    return { uid, email: dto.email, displayName: dto.displayName, role: 'school_admin', schoolId };
  }

  /**
   * Get a single school by id.
   * @param id - School id.
   * @returns The school document.
   * @throws NotFoundException when missing.
   */
  async getSchool(id: string): Promise<School> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    return school;
  }

  /**
   * Update a school's mutable fields (status and/or seatLimit).
   * @param id - School id.
   * @param dto - Partial update.
   * @returns The updated school.
   * @throws NotFoundException when missing.
   */
  async updateSchool(id: string, dto: UpdateSchoolDto): Promise<School> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    const partial: Partial<Pick<School, 'status' | 'seatLimit'>> = {};
    if (dto.status !== undefined) partial.status = dto.status;
    if (dto.seatLimit !== undefined) partial.seatLimit = dto.seatLimit;
    await this.repo.updateSchool(id, partial);
    this.logger.log({ event: 'school_updated', schoolId: id, fields: Object.keys(partial) });
    return { ...school, ...partial };
  }

  /**
   * Resolve a school's adminUids to summaries (uid/email/displayName).
   * Skips uids that no longer resolve to a user.
   * @param id - School id.
   * @returns Array of admin summaries.
   * @throws NotFoundException when the school is missing.
   */
  async listSchoolAdmins(id: string): Promise<SchoolAdminSummary[]> {
    const school = await this.repo.findById(id);
    if (!school) {
      throw new NotFoundException({ message: 'School not found', code: 'SCHOOL_NOT_FOUND' });
    }
    const admins: SchoolAdminSummary[] = [];
    for (const uid of school.adminUids) {
      const user = await this.usersRepository.findByUid(uid);
      if (user) {
        admins.push({ uid: user.uid, email: user.email, displayName: user.displayName });
      }
    }
    return admins;
  }

  /**
   * List all schools as compact summaries (no secrets).
   * @returns Array of school summaries.
   */
  async listSchools(): Promise<SchoolSummary[]> {
    const schools = await this.repo.listAll();
    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      seatLimit: s.seatLimit,
      seatsUsed: s.seatsUsed,
    }));
  }

  /**
   * Generate a random enrollment secret (prefixed for readability).
   * @returns A `sek_`-prefixed 48-hex-char secret.
   */
  private generateEnrollmentSecret(): string {
    return `sek_${randomBytes(24).toString('hex')}`;
  }
}
