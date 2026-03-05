/**
 * Classrooms module — teacher classroom management and student enrollment.
 * Imports ProgressModule for student progress data and UsersModule for user lookups.
 *
 * @module classrooms.module
 */

import { Module } from '@nestjs/common';
import { ClassroomsController } from './classrooms.controller';
import { ClassroomsService } from './classrooms.service';
import { ProgressModule } from '../progress/progress.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ProgressModule, UsersModule, AiModule],
  controllers: [ClassroomsController],
  providers: [ClassroomsService],
  exports: [ClassroomsService],
})
export class ClassroomsModule {}
