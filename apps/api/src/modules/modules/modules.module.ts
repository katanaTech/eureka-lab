import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ProgressModule } from '../progress/progress.module';

/**
 * Modules feature module — learning module list and detail.
 * Imports ProgressModule for user-specific status resolution.
 */
@Module({
  imports: [ProgressModule],
  controllers: [ModulesController],
})
export class ModulesModule {}
