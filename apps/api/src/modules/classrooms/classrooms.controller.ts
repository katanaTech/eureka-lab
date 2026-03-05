/**
 * Controller for classroom management — CRUD, join, student management.
 * Teacher endpoints require 'teacher' role; join requires 'child' role.
 *
 * @module classrooms.controller
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JoinClassroomDto } from './dto/join-classroom.dto';

/**
 * ClassroomsController provides endpoints for the teacher dashboard.
 * Routes: POST/GET /classrooms, GET /classrooms/:id,
 *         POST /classrooms/join, DELETE /classrooms/:id,
 *         DELETE /classrooms/:id/students/:studentId,
 *         POST /classrooms/:id/regenerate-code
 */
@Controller('classrooms')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ClassroomsController {
  private readonly logger = new Logger(ClassroomsController.name);

  constructor(private readonly classroomsService: ClassroomsService) {}

  /**
   * Create a new classroom.
   *
   * @param user - Authenticated teacher
   * @param dto - Classroom creation data
   * @returns Created classroom document
   */
  @Post()
  @Roles('teacher')
  @HttpCode(HttpStatus.CREATED)
  async createClassroom(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClassroomDto,
  ) {
    this.logger.log({
      event: 'create_classroom_request',
      teacherId: user.uid,
      name: dto.name,
    });

    return this.classroomsService.createClassroom(user.uid, dto.name);
  }

  /**
   * List all classrooms owned by the authenticated teacher.
   *
   * @param user - Authenticated teacher
   * @returns Array of classroom summaries
   */
  @Get()
  @Roles('teacher')
  async listClassrooms(@CurrentUser() user: AuthenticatedUser) {
    return {
      classrooms: await this.classroomsService.getTeacherClassrooms(user.uid),
    };
  }

  /**
   * Get a single classroom with full student progress data.
   *
   * @param user - Authenticated teacher
   * @param id - Classroom document ID
   * @returns Classroom detail with student progress
   */
  @Get(':id')
  @Roles('teacher')
  async getClassroomDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.classroomsService.getClassroomDetail(user.uid, id);
  }

  /**
   * Join a classroom using a join code.
   * Only child accounts can join classrooms.
   *
   * @param user - Authenticated child
   * @param dto - Join code data
   * @returns Joined classroom document
   */
  @Post('join')
  @Roles('child')
  @HttpCode(HttpStatus.OK)
  async joinClassroom(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: JoinClassroomDto,
  ) {
    this.logger.log({
      event: 'join_classroom_request',
      studentId: user.uid,
    });

    return this.classroomsService.joinClassroom(user.uid, dto.joinCode);
  }

  /**
   * Remove a student from a classroom.
   *
   * @param user - Authenticated teacher
   * @param id - Classroom document ID
   * @param studentId - Student UID to remove
   */
  @Delete(':id/students/:studentId')
  @Roles('teacher')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ): Promise<void> {
    await this.classroomsService.removeStudent(user.uid, id, studentId);
  }

  /**
   * Delete a classroom entirely.
   *
   * @param user - Authenticated teacher
   * @param id - Classroom document ID
   */
  @Delete(':id')
  @Roles('teacher')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClassroom(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.classroomsService.deleteClassroom(user.uid, id);
  }

  /**
   * Regenerate the join code for a classroom.
   *
   * @param user - Authenticated teacher
   * @param id - Classroom document ID
   * @returns New join code
   */
  @Post(':id/regenerate-code')
  @Roles('teacher')
  async regenerateJoinCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const joinCode = await this.classroomsService.regenerateJoinCode(
      user.uid,
      id,
    );
    return { joinCode };
  }
}
