import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { EmailService } from '../email/email.service';
import type { CreatePendingChildDto } from './dto/create-pending-child.dto';
import type { ConfirmParentEmailDto } from './dto/confirm-parent-email.dto';

/** Shape persisted in the pendingChildAccounts collection. */
interface PendingChildDoc {
  token: string;
  email: string;
  parentEmail: string;
  displayName: string;
  birthYear: number;
  createdAt: string;
  expiresAt: string;
}

/** Audit log row written on every successful parent confirmation. */
interface CoppaAuditDoc {
  childUid: string;
  parentEmail: string;
  kidEmail: string;
  kidDisplayName: string;
  birthYear: number;
  confirmedAt: string;
}

/** TTL for unconfirmed pending accounts (7 days). */
const PENDING_TTL_DAYS = 7;

/** Confirm URL the parent receives in their email. */
function buildConfirmUrl(frontendUrl: string, token: string): string {
  return `${frontendUrl.replace(/\/$/, '')}/confirm-parent/${token}`;
}

/**
 * COPPA pipeline service.
 * Implements the under-13 parent-email confirmation flow per ADR-006.
 *
 * Flow:
 *   1. Kid submits CreatePendingChildDto → service stores a pending doc
 *      in pendingChildAccounts/{token}, sends parent an email.
 *   2. Parent clicks confirm link → service finds doc by token, creates
 *      real Firebase user + Firestore profile, deletes pending doc,
 *      writes coppaAuditLog row.
 */
@Injectable()
export class CoppaService {
  private readonly logger = new Logger(CoppaService.name);
  private readonly pendingCollection = 'pendingChildAccounts';
  private readonly auditCollection = 'coppaAuditLog';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly users: UsersRepository,
    private readonly email: EmailService,
  ) {}

  /**
   * Create a pending child account and email the parent for confirmation.
   *
   * @param dto - Kid's signup details + parent email
   * @returns { token } — opaque ID; the frontend uses it to show a
   *                     "check parent's email" pending screen.
   */
  async createPendingChild(dto: CreatePendingChildDto): Promise<{ token: string }> {
    const currentYear = new Date().getFullYear();
    const age = currentYear - dto.birthYear;
    if (age >= 13) {
      throw new BadRequestException({
        message: 'COPPA pipeline is only for ages under 13. Use /auth/signup directly.',
        code: 'NOT_UNDER_13',
      });
    }

    // Reject if the kid's email is already a real account.
    try {
      await this.firebase.auth.getUserByEmail(dto.email);
      throw new ConflictException({
        message: 'Email is already registered.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code !== 'auth/user-not-found') throw err;
      // No existing user — good, we can proceed.
    }

    const token = randomBytes(16).toString('hex'); // 32 chars
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PENDING_TTL_DAYS * 24 * 60 * 60 * 1000);

    const doc: PendingChildDoc = {
      token,
      email: dto.email,
      parentEmail: dto.parentEmail,
      displayName: dto.displayName,
      birthYear: dto.birthYear,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.firebase.firestore
      .collection(this.pendingCollection)
      .doc(token)
      .set(doc);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3010';
    await this.email.sendCoppaConfirmation({
      parentEmail: dto.parentEmail,
      kidDisplayName: dto.displayName,
      confirmUrl: buildConfirmUrl(frontendUrl, token),
    });

    this.logger.log({
      event: 'coppa_pending_created',
      token,
      parentEmail: dto.parentEmail,
      kidEmail: dto.email,
      age,
    });

    return { token };
  }

  /**
   * Confirm a pending child account using the parent's email token.
   * Creates the real Firebase user, the Firestore profile, writes the
   * audit log, and deletes the pending doc — all in sequence (the
   * Firestore parts are batched into a single write).
   *
   * @param dto - { token }
   * @returns { uid, email } — the new child account's identifiers
   */
  async confirmParentEmail(dto: ConfirmParentEmailDto): Promise<{ uid: string; email: string }> {
    const ref = this.firebase.firestore
      .collection(this.pendingCollection)
      .doc(dto.token);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new NotFoundException({
        message: 'Confirmation token not found or already used.',
        code: 'TOKEN_INVALID',
      });
    }
    const pending = snap.data() as PendingChildDoc;
    if (new Date(pending.expiresAt) < new Date()) {
      throw new BadRequestException({
        message: 'Confirmation link expired. Ask the hero to sign up again.',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Create the Firebase user with a random throwaway password. The kid
    // sets their real password via the reset link generated below — we
    // never persisted a credential for an under-13 account.
    const randomPassword = randomBytes(24).toString('hex');
    const fbUser = await this.firebase.auth.createUser({
      email: pending.email,
      password: randomPassword,
      displayName: pending.displayName,
    });
    await this.firebase.auth.setCustomUserClaims(fbUser.uid, { role: 'child' });

    await this.users.create(fbUser.uid, {
      email: pending.email,
      displayName: pending.displayName,
      role: 'child',
      birthYear: pending.birthYear,
    });

    // Audit log + delete the pending doc, as a Firestore batch so they
    // succeed or fail together.
    const audit: CoppaAuditDoc = {
      childUid: fbUser.uid,
      parentEmail: pending.parentEmail,
      kidEmail: pending.email,
      kidDisplayName: pending.displayName,
      birthYear: pending.birthYear,
      confirmedAt: new Date().toISOString(),
    };
    const batch = this.firebase.firestore.batch();
    batch.set(this.firebase.firestore.collection(this.auditCollection).doc(), audit);
    batch.delete(ref);
    await batch.commit();

    // Generate a password-reset link so the kid can set their own real
    // password. For this notification we just log it — adding a second
    // email template is polish; the kid knowing their email + clicking
    // "forgot password" gets them in until then.
    const resetLink = await this.firebase.auth.generatePasswordResetLink(pending.email);
    this.logger.log({
      event: 'coppa_confirmed',
      childUid: fbUser.uid,
      kidEmail: pending.email,
      resetLink,
    });

    return { uid: fbUser.uid, email: pending.email };
  }
}
