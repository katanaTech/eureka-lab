import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { AcademyProgress } from '@eureka-lab/shared-types';

const COLLECTION = 'academyProgress';

function emptyProgress(): AcademyProgress {
  return {
    completedLessonIds: [],
    watchedVideoIds: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Per-user academy progress storage. Lazily creates the doc on first
 * read (matching the inventory module's pattern).
 */
@Injectable()
export class AcademyProgressService {
  private readonly logger = new Logger(AcademyProgressService.name);

  constructor(private readonly firebase: FirebaseService) {}

  /** Fetch (or lazily create) the user's academy progress. */
  async getProgress(userId: string): Promise<AcademyProgress> {
    const ref = this.firebase.firestore.collection(COLLECTION).doc(userId);
    const snap = await ref.get();
    if (!snap.exists) {
      const empty = emptyProgress();
      await ref.set(empty);
      return empty;
    }
    return snap.data() as AcademyProgress;
  }

  /**
   * Mark a lesson completed (idempotent).
   * @returns The updated AcademyProgress.
   */
  async completeLesson(userId: string, lessonId: string): Promise<AcademyProgress> {
    const ref = this.firebase.firestore.collection(COLLECTION).doc(userId);
    return this.firebase.firestore.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      const current: AcademyProgress = snap.exists
        ? (snap.data() as AcademyProgress)
        : emptyProgress();
      if (current.completedLessonIds.includes(lessonId)) return current;
      const updated: AcademyProgress = {
        ...current,
        completedLessonIds: [...current.completedLessonIds, lessonId],
        updatedAt: new Date().toISOString(),
      };
      txn.set(ref, updated);
      return updated;
    });
  }

  /**
   * Mark a video watched (idempotent).
   * @returns The updated AcademyProgress.
   */
  async watchVideo(userId: string, videoId: string): Promise<AcademyProgress> {
    const ref = this.firebase.firestore.collection(COLLECTION).doc(userId);
    return this.firebase.firestore.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      const current: AcademyProgress = snap.exists
        ? (snap.data() as AcademyProgress)
        : emptyProgress();
      if (current.watchedVideoIds.includes(videoId)) return current;
      const updated: AcademyProgress = {
        ...current,
        watchedVideoIds: [...current.watchedVideoIds, videoId],
        updatedAt: new Date().toISOString(),
      };
      txn.set(ref, updated);
      return updated;
    });
  }
}
