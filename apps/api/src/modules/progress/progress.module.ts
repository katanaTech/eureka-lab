import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { GamificationModule } from '../gamification/gamification.module';

/**
 * Progress module — module completion tracking and XP management.
 * Imports GamificationModule for badge and streak integration.
 */
@Module({
  imports: [GamificationModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
