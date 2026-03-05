import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { PlanType } from '@eureka-lab/shared-types';

/** Daily usage record stored in Firestore */
export interface DailyUsage {
  /** Number of prompts used today */
  promptsUsed: number;
  /** Total output tokens consumed today */
  tokensUsed: number;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
}

/** Plan-based daily prompt limits */
const DAILY_PROMPT_LIMITS: Record<PlanType, number> = {
  free: 20,
  explorer: 100,
  creator: 999999,
};

/**
 * Tracks per-user daily AI usage (prompts and tokens).
 * Enforces plan-based rate limits and token budgets.
 * CLAUDE.md Rule 14: Token budgets per level MUST be enforced.
 *
 * Uses Firestore subcollection: users/{uid}/daily-usage/{date}
 */
@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name);

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Get today's date string in YYYY-MM-DD format (UTC).
   * @returns Date string
   */
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get the Firestore document reference for today's usage.
   *
   * @param userId - User UID
   * @returns Firestore document reference
   */
  private getUsageDocRef(
    userId: string,
  ): FirebaseFirestore.DocumentReference {
    const dateKey = this.getTodayKey();
    return this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('daily-usage')
      .doc(dateKey);
  }

  /**
   * Get the current daily usage for a user.
   *
   * @param userId - User UID
   * @returns Current daily usage or defaults
   */
  async getDailyUsage(userId: string): Promise<DailyUsage> {
    const docRef = this.getUsageDocRef(userId);
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data() as DailyUsage;
    }

    return { promptsUsed: 0, tokensUsed: 0, date: this.getTodayKey() };
  }

  /**
   * Check if the user can make another prompt request.
   *
   * @param userId - User UID
   * @param plan - User's subscription plan
   * @returns True if within rate limit
   */
  async canMakeRequest(userId: string, plan: PlanType): Promise<boolean> {
    const usage = await this.getDailyUsage(userId);
    const limit = DAILY_PROMPT_LIMITS[plan];
    return usage.promptsUsed < limit;
  }

  /**
   * Get the number of remaining prompts for today.
   *
   * @param userId - User UID
   * @param plan - User's subscription plan
   * @returns Number of remaining prompts
   */
  async getRemainingPrompts(
    userId: string,
    plan: PlanType,
  ): Promise<number> {
    const usage = await this.getDailyUsage(userId);
    const limit = DAILY_PROMPT_LIMITS[plan];
    return Math.max(0, limit - usage.promptsUsed);
  }

  /**
   * Record a prompt usage event. Increments daily counters.
   *
   * @param userId - User UID
   * @param tokensUsed - Number of output tokens consumed
   */
  async recordUsage(userId: string, tokensUsed: number): Promise<void> {
    const docRef = this.getUsageDocRef(userId);

    try {
      await this.firebase.firestore.runTransaction(async (tx) => {
        const doc = await tx.get(docRef);

        if (doc.exists) {
          const data = doc.data() as DailyUsage;
          tx.update(docRef, {
            promptsUsed: data.promptsUsed + 1,
            tokensUsed: data.tokensUsed + tokensUsed,
          });
        } else {
          const newUsage: DailyUsage = {
            promptsUsed: 1,
            tokensUsed,
            date: this.getTodayKey(),
          };
          tx.set(docRef, newUsage);
        }
      });

      this.logger.log({
        event: 'usage_recorded',
        userId,
        tokensUsed,
        date: this.getTodayKey(),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Usage recording failed';
      this.logger.error({ event: 'usage_record_error', userId, error: message });
    }
  }
}
