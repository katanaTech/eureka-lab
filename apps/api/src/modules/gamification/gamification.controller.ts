/**
 * Controller for gamification endpoints — profile, badges, activity, streaks.
 * All endpoints require authentication.
 *
 * @module gamification.controller
 */

import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { BadgeService } from './badge.service';
import { StreakService } from './streak.service';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { getXpLevel } from '@eureka-lab/shared-types';
import type { UserGamificationProfile } from '@eureka-lab/shared-types';

/**
 * GamificationController provides endpoints for the gamification system.
 * Routes: GET /gamification/profile, /badges, /activity, /leaderboard
 *         POST /gamification/streak/freeze
 */
@Controller('gamification')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class GamificationController {
  private readonly logger = new Logger(GamificationController.name);

  constructor(
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
    private readonly firebase: FirebaseService,
  ) {}

  /**
   * Get the full gamification profile for the current user.
   * Includes XP, level, streak info, badges, and recent activity.
   *
   * @param user - Authenticated user
   * @returns Full gamification profile
   */
  @Get('profile')
  @Roles('child', 'parent', 'admin')
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserGamificationProfile> {
    const [userDoc, badges, streakInfo, recentActivity] =
      await Promise.all([
        this.firebase.firestore
          .collection('users')
          .doc(user.uid)
          .get(),
        this.badgeService.getUserBadges(user.uid),
        this.streakService.getStreakInfo(user.uid),
        this.streakService.getActivityCalendar(user.uid, 30),
      ]);

    const userData = userDoc.data() ?? {};
    const xp = (userData['xp'] as number) ?? 0;

    return {
      xp,
      level: getXpLevel(xp),
      streak: streakInfo,
      badges,
      recentActivity,
    };
  }

  /**
   * Get all earned badges for the current user.
   *
   * @param user - Authenticated user
   * @returns Array of earned badges
   */
  @Get('badges')
  @Roles('child', 'parent', 'admin')
  async getBadges(@CurrentUser() user: AuthenticatedUser) {
    return this.badgeService.getUserBadges(user.uid);
  }

  /**
   * Get the activity calendar for heatmap display.
   *
   * @param user - Authenticated user
   * @param query - Query params (days)
   * @returns Array of daily activity records
   */
  @Get('activity')
  @Roles('child', 'parent', 'admin')
  async getActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ActivityQueryDto,
  ) {
    const days = query.days ?? 30;
    return this.streakService.getActivityCalendar(user.uid, days);
  }

  /**
   * Use a streak freeze to protect the current streak.
   * Limited to 1 freeze per week.
   *
   * @param user - Authenticated user
   */
  @Post('streak/freeze')
  @Roles('child', 'parent', 'admin')
  async useStreakFreeze(@CurrentUser() user: AuthenticatedUser) {
    await this.streakService.useStreakFreeze(user.uid);

    this.logger.log({
      event: 'streak_freeze_request',
      userId: user.uid,
    });

    return { message: 'Streak freeze activated' };
  }

  /**
   * Get an anonymized leaderboard.
   * Shows first name + last initial only for child safety.
   *
   * @param query - Query params (limit)
   * @returns Anonymized leaderboard entries
   */
  @Get('leaderboard')
  @Roles('child', 'parent', 'admin')
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    const limit = query.limit ?? 10;

    const snapshot = await this.firebase.firestore
      .collection('users')
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      const displayName = (data['displayName'] as string) ?? 'User';
      /* Anonymize: first name + last initial for child safety */
      const parts = displayName.split(' ');
      const anonymized =
        parts.length > 1
          ? `${parts[0]} ${parts[1][0]}.`
          : parts[0];

      const xp = (data['xp'] as number) ?? 0;

      return {
        rank: index + 1,
        displayName: anonymized,
        xp,
        level: getXpLevel(xp),
        streak: (data['streak'] as number) ?? 0,
      };
    });
  }
}
