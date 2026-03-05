/**
 * Gamification module — badges, streaks, and XP level management.
 * Exports BadgeService and StreakService for use by other modules.
 *
 * @module gamification.module
 */

import { Module } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { StreakService } from './streak.service';
import { GamificationController } from './gamification.controller';

@Module({
  controllers: [GamificationController],
  providers: [BadgeService, StreakService],
  exports: [BadgeService, StreakService],
})
export class GamificationModule {}
