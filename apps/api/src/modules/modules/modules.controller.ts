import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ProgressService } from '../progress/progress.service';
import { findModuleById } from './module-data';
import type { PlanType } from '@eureka-lab/shared-types';

/**
 * Modules controller — list and detail for learning modules.
 * Per api-contracts.md: GET /modules, GET /modules/:id
 */
@Controller('modules')
@UseGuards(FirebaseAuthGuard)
export class ModulesController {
  private readonly logger = new Logger(ModulesController.name);

  constructor(private readonly progressService: ProgressService) {}

  /**
   * List all modules the user has access to.
   *
   * @param user - Authenticated user
   * @param level - Optional level filter
   * @returns Array of modules with resolved status
   */
  @Get()
  async listModules(
    @CurrentUser() user: AuthenticatedUser,
    @Query('level') level?: string,
  ) {
    /* Determine user plan — default to 'free' for now */
    const plan: PlanType = (user as AuthenticatedUser & { plan?: PlanType }).plan ?? 'free';
    const levelFilter = level ? parseInt(level, 10) : undefined;

    const modules = await this.progressService.getModulesForUser(
      user.uid,
      plan,
      levelFilter,
    );

    return { modules };
  }

  /**
   * Get a single module with full content and user progress.
   *
   * @param id - Module identifier
   * @param user - Authenticated user
   * @returns Full module details with progress
   */
  @Get(':id')
  async getModule(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const moduleDef = findModuleById(id);
    if (!moduleDef) {
      throw new NotFoundException(`Module ${id} not found`);
    }

    const progress = await this.progressService.getProgress(user.uid, id);

    return {
      id: moduleDef.id,
      level: moduleDef.level,
      title: moduleDef.title,
      description: moduleDef.description,
      objectives: moduleDef.objectives,
      activities: moduleDef.activities,
      status: progress?.completed
        ? 'completed'
        : progress
          ? 'in_progress'
          : 'available',
      progress: progress
        ? {
            currentActivity: progress.currentActivity,
            completedActivities: progress.completedActivities,
            score: progress.score,
          }
        : undefined,
    };
  }
}
