import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository, type UserDoc } from '../users/users.repository';
import type { SignupDto } from './dto/signup.dto';
import type { CompleteOAuthSignupDto } from './dto/complete-oauth-signup.dto';
import type { AddChildDto } from './dto/add-child.dto';
import { getXpLevel } from '@eureka-lab/shared-types';

/** Response shape for signup */
export interface SignupResult {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  token: string;
}

/** Response shape for login */
export interface LoginResult {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  plan: string;
  xp: number;
  level: number;
  children?: ChildSummaryResult[];
}

/** Child summary nested in parent profile */
export interface ChildSummaryResult {
  uid: string;
  displayName: string;
  age: number;
  plan: string;
  xp: number;
}

/** Response shape for add-child */
export interface AddChildResult {
  uid: string;
  displayName: string;
  role: string;
  age: number;
  parentUid: string;
  plan: string;
}

/**
 * Auth service — handles signup, login, logout, profile, and child account creation.
 * Business logic lives here, not in the controller.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersRepository: UsersRepository,
  ) {}

  /**
   * Derive a user role from year of birth using the kid-signup age rules
   * defined in ADR-006. Throws structured exceptions for the rejected
   * branches so the controller layer can surface meaningful error codes.
   *
   * @param birthYear - 4-digit year of birth (validated by SignupDto).
   * @returns 'child' for ages 13–16, 'parent' for ages 18+.
   * @throws BadRequestException with `code: 'AGE_GAP'` for age 17.
   * @throws BadRequestException with `code: 'UNDER_13_PIPELINE_REQUIRED'` for age <13.
   */
  private deriveRole(birthYear: number): 'child' | 'parent' {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 13) {
      throw new BadRequestException({
        message:
          'Under 13 requires parent confirmation. Use the COPPA signup flow instead.',
        code: 'UNDER_13_PIPELINE_REQUIRED',
      });
    }
    if (age === 17) {
      throw new BadRequestException({
        message:
          'Heroes are 13–16 and adults are 18+. Contact support if you are 17.',
        code: 'AGE_GAP',
      });
    }
    return age <= 16 ? 'child' : 'parent';
  }

  /**
   * Create a new account. Role is derived from `birthYear` per ADR-006.
   * Under-13 callers MUST use the COPPA flow (see CoppaController in
   * Phase C); this endpoint rejects them with a specific code so the
   * frontend can pivot.
   *
   * @param dto - Signup data (email, password, displayName, birthYear)
   * @returns Created user info with token
   */
  async signup(dto: SignupDto): Promise<SignupResult> {
    const role = this.deriveRole(dto.birthYear);

    try {
      const firebaseUser = await this.firebaseService.auth.createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
      });

      await this.firebaseService.auth.setCustomUserClaims(firebaseUser.uid, { role });

      await this.usersRepository.create(firebaseUser.uid, {
        email: dto.email,
        displayName: dto.displayName,
        role,
        birthYear: dto.birthYear,
      });

      const token = await this.firebaseService.auth.createCustomToken(firebaseUser.uid);

      this.logger.log({ event: 'signup', uid: firebaseUser.uid, role, birthYear: dto.birthYear });

      return {
        uid: firebaseUser.uid,
        email: dto.email,
        displayName: dto.displayName,
        role,
        token,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      const code = (error as { code?: string }).code ?? '';
      if (
        msg.includes('email-already-exists') ||
        msg.includes('already in use') ||
        code === 'auth/email-already-exists'
      ) {
        throw new ConflictException({
          message: 'Email address is already registered',
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }
      throw error;
    }
  }

  /**
   * Create a Firestore profile for an already-authenticated OAuth user.
   * Looks up the Firebase user's email + displayName via the Admin SDK
   * (the caller only supplies the verified UID + birthYear). Uses the same
   * role-derivation rules as `signup`. Idempotent: if a profile already
   * exists for `uid`, returns it unchanged.
   *
   * @param uid - Firebase UID (from the verified ID token)
   * @param dto - { birthYear }
   * @returns SignupResult-shaped payload
   */
  async completeOAuthSignup(
    uid: string,
    dto: CompleteOAuthSignupDto,
  ): Promise<SignupResult> {
    // Idempotency — if a profile already exists, return it.
    const existing = await this.usersRepository.findByUid(uid);
    if (existing) {
      return {
        uid: existing.uid,
        email: existing.email,
        displayName: existing.displayName,
        role: existing.role,
        token: await this.firebaseService.auth.createCustomToken(uid),
      };
    }

    const fbUser = await this.firebaseService.auth.getUser(uid);
    const email = fbUser.email ?? '';
    const displayName = fbUser.displayName ?? email.split('@')[0] ?? 'Hero';
    const role = this.deriveRole(dto.birthYear);

    await this.firebaseService.auth.setCustomUserClaims(uid, { role });

    await this.usersRepository.create(uid, {
      email,
      displayName,
      role,
      birthYear: dto.birthYear,
    });

    const token = await this.firebaseService.auth.createCustomToken(uid);

    this.logger.log({ event: 'oauth_signup', uid, role, birthYear: dto.birthYear });

    return { uid, email, displayName, role, token };
  }

  /**
   * Verify a Firebase ID token and return the enriched user profile.
   * @param idToken - Firebase ID token from the client
   * @returns Enriched user profile
   */
  async login(idToken: string): Promise<LoginResult> {
    let decoded;
    try {
      decoded = await this.firebaseService.auth.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException({
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
      });
    }

    const userDoc = await this.usersRepository.findByUid(decoded.uid);
    if (!userDoc) {
      throw new NotFoundException({
        message: 'User profile not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const xpLevel = getXpLevel(userDoc.xp);

    const result: LoginResult = {
      uid: userDoc.uid,
      email: userDoc.email,
      displayName: userDoc.displayName,
      role: userDoc.role,
      plan: userDoc.plan,
      xp: userDoc.xp,
      level: xpLevel.level,
    };

    if (userDoc.role === 'parent') {
      result.children = await this.getChildSummaries(userDoc.uid);
    }

    this.logger.log({ event: 'login', uid: decoded.uid, role: userDoc.role });
    return result;
  }

  /**
   * Get the authenticated user's full profile.
   * @param uid - Firebase UID
   * @returns User profile with children if parent
   */
  async getMe(uid: string): Promise<LoginResult & { streak: number; level: number }> {
    const userDoc = await this.usersRepository.findByUid(uid);
    if (!userDoc) {
      throw new NotFoundException({
        message: 'User profile not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const xpLevel = getXpLevel(userDoc.xp);

    const result = {
      uid: userDoc.uid,
      email: userDoc.email,
      displayName: userDoc.displayName,
      role: userDoc.role,
      plan: userDoc.plan,
      xp: userDoc.xp,
      level: xpLevel.level,
      streak: userDoc.streak,
      children: undefined as ChildSummaryResult[] | undefined,
    };

    if (userDoc.role === 'parent') {
      result.children = await this.getChildSummaries(userDoc.uid);
    }

    return result;
  }

  /**
   * Revoke all refresh tokens for a user (server-side logout).
   * @param uid - Firebase UID
   */
  async logout(uid: string): Promise<void> {
    await this.firebaseService.auth.revokeRefreshTokens(uid);
    this.logger.log({ event: 'logout', uid });
  }

  /**
   * Create a child sub-account under a parent.
   * Enforces age 8-16, max 5 children per parent.
   * @param parentUid - Parent's Firebase UID
   * @param dto - Child data
   * @returns Created child info
   */
  async addChild(parentUid: string, dto: AddChildDto): Promise<AddChildResult> {
    const currentYear = new Date().getFullYear();
    const age = currentYear - dto.birthYear;

    if (age < 8 || age > 16) {
      throw new ForbiddenException({
        message: 'Child must be between 8 and 16 years old',
        code: 'AGE_OUT_OF_RANGE',
      });
    }

    const childCount = await this.usersRepository.countChildrenByParent(parentUid);
    if (childCount >= 5) {
      throw new ConflictException({
        message: 'Maximum 5 child accounts per parent',
        code: 'MAX_CHILDREN_REACHED',
      });
    }

    const childUser = await this.firebaseService.auth.createUser({
      displayName: dto.displayName,
    });

    await this.firebaseService.auth.setCustomUserClaims(childUser.uid, { role: 'child' });

    await this.usersRepository.create(childUser.uid, {
      email: '',
      displayName: dto.displayName,
      role: 'child',
      parentUid,
      birthYear: dto.birthYear,
    });

    await this.usersRepository.addChildToParent(parentUid, childUser.uid);

    this.logger.log({ event: 'child_created', childUid: childUser.uid, parentUid, age });

    return {
      uid: childUser.uid,
      displayName: dto.displayName,
      role: 'child',
      age,
      parentUid,
      plan: 'free',
    };
  }

  /**
   * Send a verification email to the user.
   * The actual email is sent by Firebase — we just generate the link.
   * @param uid - Firebase UID
   */
  async sendEmailVerification(uid: string): Promise<void> {
    const user = await this.firebaseService.auth.getUser(uid);
    if (!user.email) {
      throw new NotFoundException({ message: 'No email on account', code: 'NO_EMAIL' });
    }
    await this.firebaseService.auth.generateEmailVerificationLink(user.email);
    this.logger.log({ event: 'verification_email_sent', uid });
  }

  /**
   * Get child summaries for a parent's profile response.
   * @param parentUid - Parent UID
   * @returns Array of child summaries
   */
  private async getChildSummaries(parentUid: string): Promise<ChildSummaryResult[]> {
    const children = await this.usersRepository.findChildrenByParent(parentUid);
    const currentYear = new Date().getFullYear();

    return children.map((child) => ({
      uid: child.uid,
      displayName: child.displayName,
      age: child.birthYear ? currentYear - child.birthYear : 0,
      plan: child.plan,
      xp: child.xp,
    }));
  }
}
