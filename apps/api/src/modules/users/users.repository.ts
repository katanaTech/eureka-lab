import { Injectable, Logger } from '@nestjs/common';
import { Timestamp } from 'firebase-admin/firestore';
import type { SubscriptionData, PlanType, FantasyCharacter, UserRole } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/**
 * Firestore document shape for a user record.
 */
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId?: string;
  active?: boolean;
  username?: string;
  plan: 'free' | 'explorer' | 'creator';
  xp: number;
  streak: number;
  parentUid?: string;
  birthYear?: number;
  children?: string[];
  subscription?: SubscriptionData;
  character?: FantasyCharacter;
  /** Last gamified-activity date (`YYYY-MM-DD`), maintained by the streak service; absent until first activity. */
  lastActiveDate?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Data required to create a new user document.
 */
export interface CreateUserData {
  email: string;
  displayName: string;
  role: UserRole;
  schoolId?: string;
  active?: boolean;
  username?: string;
  parentUid?: string;
  birthYear?: number;
}

/**
 * Firestore repository for user documents.
 * CLAUDE.md Rule 3: Never write Firestore queries without a userId filter.
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  private readonly collection = 'users';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Get user by UID. Returns null if not found.
   * @param uid - Firebase UID
   * @returns User document or null
   */
  async findByUid(uid: string): Promise<UserDoc | null> {
    const doc = await this.firebase.firestore.collection(this.collection).doc(uid).get();
    return doc.exists ? (doc.data() as UserDoc) : null;
  }

  /**
   * Create a new user document with schema validation.
   * CLAUDE.md Rule 5: All child data must pass schema validation before write.
   * @param uid - Firebase UID
   * @param data - User creation data
   */
  async create(uid: string, data: CreateUserData): Promise<UserDoc> {
    const now = Timestamp.now();
    const userDoc: Omit<UserDoc, 'children'> & { children?: string[] } = {
      uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      plan: 'free',
      xp: 0,
      streak: 0,
      ...(data.parentUid && { parentUid: data.parentUid }),
      ...(data.schoolId && { schoolId: data.schoolId }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.username !== undefined && { username: data.username }),
      ...(data.birthYear && { birthYear: data.birthYear }),
      ...(data.role === 'parent' && { children: [] }),
      createdAt: now,
      updatedAt: now,
    };

    await this.firebase.firestore.collection(this.collection).doc(uid).set(userDoc);
    this.logger.log({ event: 'user_created', uid, role: data.role });
    return userDoc as UserDoc;
  }

  /**
   * Add a child UID to a parent's children array.
   * @param parentUid - Parent's Firebase UID
   * @param childUid - Child's Firebase UID
   */
  async addChildToParent(parentUid: string, childUid: string): Promise<void> {
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collection)
      .doc(parentUid)
      .update({
        children: FieldValue.arrayUnion(childUid),
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  /**
   * Get all children for a parent.
   * @param parentUid - Parent's Firebase UID
   * @returns Array of child user documents
   */
  async findChildrenByParent(parentUid: string): Promise<UserDoc[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('parentUid', '==', parentUid)
      .get();

    return snapshot.docs.map((doc) => doc.data() as UserDoc);
  }

  /**
   * Count children for a parent (used to enforce max 5 limit).
   * @param parentUid - Parent's Firebase UID
   * @returns Number of children
   */
  async countChildrenByParent(parentUid: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('parentUid', '==', parentUid)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Find all teacher user docs belonging to a school.
   * @param schoolId - School tenant id.
   * @returns Teacher user documents.
   */
  async findTeachersBySchool(schoolId: string): Promise<UserDoc[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('role', '==', 'teacher')
      .where('schoolId', '==', schoolId)
      .get();
    return snapshot.docs.map((d) => d.data() as UserDoc);
  }

  /**
   * Count teacher user docs in a school.
   * @param schoolId - School tenant id.
   * @returns Teacher count.
   */
  async countTeachersBySchool(schoolId: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('role', '==', 'teacher')
      .where('schoolId', '==', schoolId)
      .count()
      .get();
    return snapshot.data().count;
  }

  /**
   * Count active students in a school (child users whose lastActiveDate is
   * on or after the cutoff). Requires the `users` composite index in
   * firestore.indexes.json (schoolId+role+lastActiveDate); the query errors
   * until that index is deployed (tracked with DEPLOY-001).
   * @param schoolId - School tenant id.
   * @param sinceDate - Inclusive cutoff as a YYYY-MM-DD string.
   * @returns Active-student count.
   */
  async countActiveStudents(schoolId: string, sinceDate: string): Promise<number> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('schoolId', '==', schoolId)
      .where('role', '==', 'child')
      .where('lastActiveDate', '>=', sinceDate)
      .count()
      .get();
    return snapshot.data().count;
  }

  /**
   * Find all student (child) user docs belonging to a school.
   * @param schoolId - School tenant id.
   * @returns Student user documents.
   */
  async findStudentsBySchool(schoolId: string): Promise<UserDoc[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('role', '==', 'child')
      .where('schoolId', '==', schoolId)
      .get();
    return snapshot.docs.map((d) => d.data() as UserDoc);
  }

  /**
   * Set the `active` flag on a user document.
   * @param uid - Firebase UID.
   * @param active - New active state.
   */
  async setActive(uid: string, active: boolean): Promise<void> {
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collection)
      .doc(uid)
      .update({ active, updatedAt: FieldValue.serverTimestamp() });
  }

  /**
   * Update subscription data and plan on a user document.
   * Uses atomic update to ensure consistency.
   * @param uid - Firebase UID
   * @param plan - New plan type
   * @param subscription - Subscription data to store
   */
  async updateSubscription(
    uid: string,
    plan: PlanType,
    subscription: SubscriptionData,
  ): Promise<void> {
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collection)
      .doc(uid)
      .update({
        plan,
        subscription,
        updatedAt: FieldValue.serverTimestamp(),
      });

    this.logger.log({ event: 'subscription_updated', uid, plan, status: subscription.status });
  }

  /**
   * Clear subscription data and downgrade to free plan.
   * Called when a subscription is fully canceled/expired.
   * @param uid - Firebase UID
   */
  async clearSubscription(uid: string): Promise<void> {
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collection)
      .doc(uid)
      .update({
        plan: 'free',
        subscription: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    this.logger.log({ event: 'subscription_cleared', uid });
  }

  /**
   * Find a user by their Stripe customer ID.
   * Used by webhook handlers to look up users from Stripe events.
   * @param customerId - Stripe customer ID (cus_...)
   * @returns User document or null
   */
  async findByStripeCustomerId(customerId: string): Promise<UserDoc | null> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserDoc;
  }

  /**
   * Find a user by their Stripe subscription ID.
   * Used by webhook handlers for subscription lifecycle events.
   * @param subscriptionId - Stripe subscription ID (sub_...)
   * @returns User document or null
   */
  async findByStripeSubscriptionId(subscriptionId: string): Promise<UserDoc | null> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('subscription.stripeSubscriptionId', '==', subscriptionId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as UserDoc;
  }

  /**
   * Get the user's fantasy character.
   * @param uid - Firebase UID
   * @returns FantasyCharacter or null
   */
  async getCharacter(uid: string): Promise<FantasyCharacter | null> {
    const doc = await this.firebase.firestore.collection(this.collection).doc(uid).get();
    if (!doc.exists) return null;
    const data = doc.data() as UserDoc;
    return data.character ?? null;
  }

  /**
   * Create or update the user's fantasy character.
   * @param uid - Firebase UID
   * @param character - Character data to save
   */
  async setCharacter(uid: string, character: FantasyCharacter): Promise<void> {
    const { FieldValue } = await import('firebase-admin/firestore');
    await this.firebase.firestore
      .collection(this.collection)
      .doc(uid)
      .update({ character, updatedAt: FieldValue.serverTimestamp() });
    this.logger.log({ event: 'character_saved', uid, characterName: character.name });
  }
}
