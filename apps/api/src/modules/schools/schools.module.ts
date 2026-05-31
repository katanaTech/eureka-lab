import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { SchoolsRepository } from './schools.repository';
import { SchoolTeachersController } from './school-teachers.controller';
import { SchoolTeachersService } from './school-teachers.service';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

/**
 * Schools module — super-admin tenant management (B2B foundation).
 * Imports UsersModule (UsersRepository) and AiModule (ContentModerationService).
 */
@Module({
  imports: [UsersModule, AiModule],
  controllers: [SchoolsController, SchoolTeachersController],
  providers: [SchoolsService, SchoolsRepository, SchoolTeachersService],
  exports: [SchoolsService, SchoolsRepository],
})
export class SchoolsModule {}
