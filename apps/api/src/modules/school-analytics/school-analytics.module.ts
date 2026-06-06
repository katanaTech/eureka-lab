import { Module } from '@nestjs/common';
import { SchoolAnalyticsController } from './school-analytics.controller';
import { SchoolAnalyticsService } from './school-analytics.service';
import { SchoolsModule } from '../schools/schools.module';
import { UsersModule } from '../users/users.module';
import { ClassroomsModule } from '../classrooms/classrooms.module';

/**
 * School analytics module — super-admin usage views.
 * Imports SchoolsModule (SchoolsRepository), UsersModule (UsersRepository),
 * ClassroomsModule (ClassroomsService).
 */
@Module({
  imports: [SchoolsModule, UsersModule, ClassroomsModule],
  controllers: [SchoolAnalyticsController],
  providers: [SchoolAnalyticsService],
})
export class SchoolAnalyticsModule {}
