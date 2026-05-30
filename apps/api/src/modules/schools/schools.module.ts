import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { SchoolsRepository } from './schools.repository';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

/**
 * Schools module — super-admin tenant management (B2B foundation).
 * Imports UsersModule (UsersRepository) and AiModule (ContentModerationService).
 */
@Module({
  imports: [UsersModule, AiModule],
  controllers: [SchoolsController],
  providers: [SchoolsService, SchoolsRepository],
  exports: [SchoolsService, SchoolsRepository],
})
export class SchoolsModule {}
