import { Injectable, Logger } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import type { School } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/** Max schools returned by an unbounded list (CLAUDE.md Rule 3 — no unbounded reads). */
const MAX_SCHOOLS = 500;
/** Ambiguity-free charset for login codes (mirrors classroom join codes). */
const LOGIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Login code length. */
const LOGIN_CODE_LENGTH = 6;

/**
 * Firestore repository for school tenant documents (`schools/{id}`).
 */
@Injectable()
export class SchoolsRepository {
  private readonly logger = new Logger(SchoolsRepository.name);
  private readonly collection = 'schools';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Generate a new Firestore auto-id for a school (used before write so the
   * id can be embedded in the document body).
   * @returns A fresh document id.
   */
  newId(): string {
    return this.firebase.firestore.collection(this.collection).doc().id;
  }

  /**
   * Write a fully-formed school document.
   * @param school - Complete school record (id already set).
   * @returns The same school record.
   */
  async createSchool(school: School): Promise<School> {
    await this.firebase.firestore.collection(this.collection).doc(school.id).set(school);
    this.logger.log({ event: 'school_created', schoolId: school.id });
    return school;
  }

  /**
   * Update mutable school fields (status / seatLimit / subscription / billingEmail).
   * @param id - School id.
   * @param partial - Subset of mutable fields to write.
   */
  async updateSchool(
    id: string,
    partial: Partial<Pick<School, 'status' | 'seatLimit' | 'subscription' | 'billingEmail'>>,
  ): Promise<void> {
    await this.firebase.firestore.collection(this.collection).doc(id).update(partial);
  }

  /**
   * Fetch a school by id.
   * @param id - School document id.
   * @returns The school or null if not found.
   */
  async findById(id: string): Promise<School | null> {
    const doc = await this.firebase.firestore.collection(this.collection).doc(id).get();
    return doc.exists ? (doc.data() as School) : null;
  }

  /**
   * Find a school by its Stripe subscription id (webhook subscription events).
   * @param subscriptionId - Stripe subscription id (sub_...).
   * @returns The school or null.
   */
  async findByStripeSubscriptionId(subscriptionId: string): Promise<School | null> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('subscription.stripeSubscriptionId', '==', subscriptionId)
      .limit(1)
      .get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as School);
  }

  /**
   * Find a school by its Stripe customer id (webhook invoice events).
   * @param customerId - Stripe customer id (cus_...).
   * @returns The school or null.
   */
  async findByStripeCustomerId(customerId: string): Promise<School | null> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as School);
  }

  /**
   * List all schools (bounded to MAX_SCHOOLS).
   * @returns Array of school records.
   */
  async listAll(): Promise<School[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collection)
      .limit(MAX_SCHOOLS)
      .get();
    return snapshot.docs.map((d) => d.data() as School);
  }

  /**
   * Append a school_admin uid to a school's adminUids array.
   * @param id - School id.
   * @param uid - school_admin uid.
   */
  async addAdminUid(id: string, uid: string): Promise<void> {
    await this.firebase.firestore
      .collection(this.collection)
      .doc(id)
      .update({ adminUids: FieldValue.arrayUnion(uid) });
  }

  /**
   * Atomically change a school's seatsUsed counter.
   * @param id - School id.
   * @param delta - Amount to add (may be negative).
   */
  async incrementSeatsUsed(id: string, delta: number): Promise<void> {
    await this.firebase.firestore
      .collection(this.collection)
      .doc(id)
      .update({ seatsUsed: FieldValue.increment(delta) });
  }

  /**
   * Generate a 6-char school login code not currently in use.
   * @returns A unique login code.
   * @throws {Error} if all 10 uniqueness attempts collide (astronomically unlikely).
   */
  async generateUniqueLoginCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < LOGIN_CODE_LENGTH; i++) {
        code += LOGIN_CODE_CHARS[Math.floor(Math.random() * LOGIN_CODE_CHARS.length)];
      }
      const existing = await this.firebase.firestore
        .collection(this.collection)
        .where('loginCode', '==', code)
        .limit(1)
        .get();
      if (existing.empty) return code;
    }
    throw new Error('Failed to generate a unique school login code');
  }
}
