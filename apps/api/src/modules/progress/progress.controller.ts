import {
  Controller,
  Post,
  Param,
  Body,
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
import { ProgressService } from './progress.service';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';

/**
 * Progress controller — tracks module completion.
 * Per api-contracts.md: POST /progress/:moduleId/complete
 * Integrates with gamification for badges and streaks.
 */
@Controller('progress')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(
    private readonly progressService: ProgressService,
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
  ) {}

  /**
   * Mark an activity as complete within a module.
   *
   * @param moduleId - Module identifier (from URL path)
   * @param dto - Activity completion data
   * @param user - Authenticated user
   * @returns Completion result with XP, badges, and streak info
   */
  @Post(':moduleId/complete')
  @Roles('child', 'parent', 'admin')
  async completeActivity(
    @Param('moduleId') moduleId: string,
    @Body() dto: CompleteActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.progressService.completeActivity(
      user.uid,
      moduleId,
      dto.activityIndex,
      dto.score,
    );

    /* Record daily activity and update streak */
    await this.streakService.recordDailyActivity(
      user.uid,
      result.xpAwarded,
      false,
    );
    const streakResult = await this.streakService.updateStreak(user.uid);

    /* Check for badge unlocks */
    const badgeResult = await this.badgeService.checkAndAwardBadges(
      user.uid,
      {
        type: result.moduleCompleted
          ? 'module_completed'
          : 'activity_completed',
        moduleId,
        activityIndex: dto.activityIndex,
      },
    );

    /* If streak milestone was reached, check streak badges too */
    if (streakResult.bonusXp > 0) {
      const streakBadges = await this.badgeService.checkAndAwardBadges(
        user.uid,
        {
          type: 'streak_milestone',
          streakDays: streakResult.streak,
        },
      );
      badgeResult.newBadges.push(...streakBadges.newBadges);
    }

    /* Track activity type for "Curious Mind" badge */
    await this.badgeService.recordPromptStats(user.uid, {
      activityType: dto.score !== undefined ? 'quiz' : 'lesson',
    });

    this.logger.log({
      event: 'activity_complete_request',
      userId: user.uid,
      moduleId,
      activityIndex: dto.activityIndex,
      xpAwarded: result.xpAwarded,
      badgesUnlocked: badgeResult.newBadges.length,
    });

    return {
      xpAwarded: result.xpAwarded,
      streakBonusXp: streakResult.bonusXp,
      badgesUnlocked: badgeResult.newBadges,
      moduleCompleted: result.moduleCompleted,
      nextModuleId: result.nextModuleId,
      currentStreak: streakResult.streak,
    };
  }
}
