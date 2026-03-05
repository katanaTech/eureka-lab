import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { AiModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';

/**
 * Agents module — buddy agent CRUD and AI chat for Level 4.
 * Imports AiModule for the AI gateway and moderation services.
 * Imports GamificationModule for badge/streak tracking on agent actions.
 */
@Module({
  imports: [AiModule, GamificationModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
