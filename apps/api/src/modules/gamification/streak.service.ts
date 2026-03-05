/**
 * Service for tracking daily activity and managing streaks.
 * Uses Firestore subcollections:
 *   - users/{uid}/daily-activity/{YYYY-MM-DD}
 *   - users/{uid} (streak, longestStreak, lastActiveDate fields)
 *
 * @module streak.service
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { StreakInfo, DayActivity } from '@eureka-lab/shared-types';
import { STREAK_BONUSES } from '@eureka-lab/shared-types';

/**
 * StreakService manages daily activity records and streak calculations.
 * Streak increments when a user has activity on consecutive UTC calendar days.
 */
@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Get today's date in YYYY-MM-DD format (UTC).
   * @returns Date string
   */
  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format (UTC).
   * @returns Date string
   */
  private getYesterdayKey(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Record daily activity for a user. Creates or updates the daily doc.
   * Should be called after any meaningful user action (prompt, activity completion).
   *
   * @param userId - User UID
   * @param xpEarned - XP earned in this action (default 0)
   * @param isPrompt - Whether this action was an AI prompt (default false)
   */
  async recordDailyActivity(
    userId: string,
    xpEarned: number = 0,
    isPrompt: boolean = false,
  ): Promise<void> {
    const todayKey = this.getTodayKey();
    const dailyRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('daily-activity')
      .doc(todayKey);

    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(dailyRef);

      if (doc.exists) {
        const data = doc.data() ?? {};
        tx.update(dailyRef, {
          promptsUsed:
            ((data['promptsUsed'] as number) ?? 0) + (isPrompt ? 1 : 0),
          activitiesCompleted:
            ((data['activitiesCompleted'] as number) ?? 0) +
            (isPrompt ? 0 : 1),
          xpEarned: ((data['xpEarned'] as number) ?? 0) + xpEarned,
          updatedAt: new Date().toISOString(),
        });
      } else {
        tx.set(dailyRef, {
          date: todayKey,
          promptsUsed: isPrompt ? 1 : 0,
          activitiesCompleted: isPrompt ? 0 : 1,
          xpEarned,
          minutesActive: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Update the user's streak based on daily activity records.
   * Returns the new streak value and any streak bonus XP earned.
   *
   * @param userId - User UID
   * @returns Object with updated streak and any bonus XP
   */
  async updateStreak(
    userId: string,
  ): Promise<{ streak: number; bonusXp: number }> {
    const userRef = this.firebase.firestore
      .collection('users')
      .doc(userId);

    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();

    return this.firebase.firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      const userData = userDoc.data() ?? {};

      const lastActiveDate =
        (userData['lastActiveDate'] as string) ?? '';
      const currentStreak = (userData['streak'] as number) ?? 0;
      const longestStreak = (userData['longestStreak'] as number) ?? 0;

      let newStreak: number;

      if (lastActiveDate === todayKey) {
        /* Already counted today — no change */
        return { streak: currentStreak, bonusXp: 0 };
      } else if (lastActiveDate === yesterdayKey) {
        /* Consecutive day — increment streak */
        newStreak = currentStreak + 1;
      } else if (lastActiveDate === '') {
        /* First ever activity */
        newStreak = 1;
      } else {
        /* Streak broken — check for freeze */
        const freezeUsed =
          (userData['streakFreezeUsedThisWeek'] as boolean) ?? false;
        if (!freezeUsed && currentStreak > 0) {
          /* Could use auto-freeze logic here if desired */
          newStreak = 1;
        } else {
          newStreak = 1;
        }
      }

      const newLongest = Math.max(longestStreak, newStreak);

      tx.update(userRef, {
        streak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: todayKey,
      });

      /* Check for streak bonus */
      const bonusXp = STREAK_BONUSES[newStreak] ?? 0;
      if (bonusXp > 0) {
        /* Award bonus XP */
        const currentXp = (userData['xp'] as number) ?? 0;
        tx.update(userRef, {
          xp: currentXp + bonusXp,
        });

        this.logger.log({
          event: 'streak_bonus',
          userId,
          streak: newStreak,
          bonusXp,
        });
      }

      this.logger.log({
        event: 'streak_updated',
        userId,
        previousStreak: currentStreak,
        newStreak,
        longestStreak: newLongest,
      });

      return { streak: newStreak, bonusXp };
    });
  }

  /**
   * Get streak information for a user.
   * @param userId - User UID
   * @returns Streak info with current, longest, and freeze status
   */
  async getStreakInfo(userId: string): Promise<StreakInfo> {
    const userDoc = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .get();

    const data = userDoc.data() ?? {};
    const lastActiveDate =
      (data['lastActiveDate'] as string) ?? '';
    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();

    /* If last active was before yesterday, streak is broken */
    let current = (data['streak'] as number) ?? 0;
    if (
      lastActiveDate !== todayKey &&
      lastActiveDate !== yesterdayKey &&
      lastActiveDate !== ''
    ) {
      current = 0;
    }

    const freezeUsed =
      (data['streakFreezeUsedThisWeek'] as boolean) ?? false;

    return {
      current,
      longest: (data['longestStreak'] as number) ?? 0,
      lastActiveDate,
      freezesRemaining: freezeUsed ? 0 : 1,
    };
  }

  /**
   * Use a streak freeze to protect the streak from breaking.
   * Limited to 1 freeze per week (resets on Monday UTC).
   *
   * @param userId - User UID
   */
  async useStreakFreeze(userId: string): Promise<void> {
    const userRef = this.firebase.firestore
      .collection('users')
      .doc(userId);

    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      const data = doc.data() ?? {};

      const freezeUsed =
        (data['streakFreezeUsedThisWeek'] as boolean) ?? false;

      if (freezeUsed) {
        throw new BadRequestException(
          'Streak freeze already used this week',
        );
      }

      const todayKey = this.getTodayKey();

      tx.update(userRef, {
        streakFreezeUsedThisWeek: true,
        lastActiveDate: todayKey,
      });

      this.logger.log({
        event: 'streak_freeze_used',
        userId,
      });
    });
  }

  /**
   * Get the activity calendar for the last N days.
   * Returns an array of DayActivity records for heatmap display.
   *
   * @param userId - User UID
   * @param days - Number of days to fetch (default 30)
   * @returns Array of DayActivity records
   */
  async getActivityCalendar(
    userId: string,
    days: number = 30,
  ): Promise<DayActivity[]> {
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);
    const startKey = startDate.toISOString().split('T')[0];

    const snapshot = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('daily-activity')
      .where('date', '>=', startKey)
      .orderBy('date', 'asc')
      .get();

    const activityMap = new Map<string, DayActivity>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      activityMap.set(data['date'] as string, {
        date: data['date'] as string,
        minutesActive: (data['minutesActive'] as number) ?? 0,
        promptsUsed: (data['promptsUsed'] as number) ?? 0,
        activitiesCompleted:
          (data['activitiesCompleted'] as number) ?? 0,
        xpEarned: (data['xpEarned'] as number) ?? 0,
      });
    }

    /* Fill in missing days with zeros */
    const result: DayActivity[] = [];
    const cursor = new Date(startDate);
    const today = new Date();

    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0];
      result.push(
        activityMap.get(key) ?? {
          date: key,
          minutesActive: 0,
          promptsUsed: 0,
          activitiesCompleted: 0,
          xpEarned: 0,
        },
      );
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return result;
  }
}
