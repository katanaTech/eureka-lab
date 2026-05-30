import { Injectable, Logger } from '@nestjs/common';
import { FieldValue } from 'firebase-admin/firestore';
import type { School } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/** Max schools returned by an unbounded list (CLAUDE.md Rule 3 — no unbounded reads). */
const MAX_SCHOOLS = 500;

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
   * Update mutable school fields (status / seatLimit).
   * @param id - School id.
   * @param partial - Subset of mutable fields to write.
   */
  async updateSchool(
    id: string,
    partial: Partial<Pick<School, 'status' | 'seatLimit'>>,
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
}
