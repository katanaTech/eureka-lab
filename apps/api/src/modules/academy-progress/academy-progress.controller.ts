import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AcademyProgressService } from './academy-progress.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { WatchVideoDto } from './dto/watch-video.dto';
import type { AcademyProgress } from '@eureka-lab/shared-types';

@Controller('academy-progress')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('child')
export class AcademyProgressController {
  constructor(private readonly service: AcademyProgressService) {}

  @Get()
  async getProgress(@CurrentUser() user: AuthenticatedUser): Promise<AcademyProgress> {
    return this.service.getProgress(user.uid);
  }

  @Post('complete-lesson')
  async completeLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteLessonDto,
  ): Promise<AcademyProgress> {
    return this.service.completeLesson(user.uid, dto.lessonId);
  }

  @Post('watch-video')
  async watchVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WatchVideoDto,
  ): Promise<AcademyProgress> {
    return this.service.watchVideo(user.uid, dto.videoId);
  }
}
