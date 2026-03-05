import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AiModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';

/**
 * Projects module — code project CRUD and AI code generation for Level 3.
 * Imports AiModule for the AI gateway and moderation services.
 * Imports GamificationModule for badge/streak tracking on project actions.
 */
@Module({
  imports: [AiModule, GamificationModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
