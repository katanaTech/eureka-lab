import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { AiModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';

/**
 * Workflows module — workflow CRUD and execution for Level 2.
 * Imports AiModule for the AI gateway and moderation services.
 * Imports GamificationModule for badge/streak tracking on workflow actions.
 */
@Module({
  imports: [AiModule, GamificationModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
