import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiGatewayService } from './ai-gateway.service';
import { ContentModerationService } from './content-moderation.service';
import { ModerationLogService } from './moderation-log.service';
import { UsageTrackerService } from './usage-tracker.service';
import { GamificationModule } from '../gamification/gamification.module';

/**
 * AI module — AI gateway, moderation, and usage tracking.
 * CLAUDE.md Rule 1: All AI calls go through NestJS gateway.
 * Imports GamificationModule for streak tracking on prompt usage.
 */
@Module({
  imports: [GamificationModule],
  controllers: [AiController],
  providers: [
    AiGatewayService,
    ContentModerationService,
    ModerationLogService,
    UsageTrackerService,
  ],
  exports: [
    AiGatewayService,
    ContentModerationService,
    ModerationLogService,
    UsageTrackerService,
  ],
})
export class AiModule {}
