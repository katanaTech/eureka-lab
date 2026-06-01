import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SchoolStudentsService } from './school-students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentActiveDto } from './dto/update-student-active.dto';

/**
 * School-admin student management, scoped to the caller's own school by
 * TenantGuard (super_admin bypasses). Base route: /schools/:id/students.
 */
@Controller('schools/:id/students')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
export class SchoolStudentsController {
  constructor(private readonly studentsService: SchoolStudentsService) {}

  /**
   * Provision a student in this school.
   * @param user - Authenticated admin (recorded on the consent audit row).
   * @param id - School id.
   * @param dto - Student data.
   * @returns The provisioned student summary.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.createStudent(id, dto, user.uid);
  }

  /**
   * List this school's students + login code + seat usage.
   * @param id - School id.
   * @returns Roster payload.
   */
  @Get()
  async list(@Param('id') id: string) {
    return this.studentsService.listRoster(id);
  }

  /**
   * Activate / deactivate a student.
   * @param id - School id.
   * @param studentId - Student uid.
   * @param dto - { active }.
   * @returns The updated student summary.
   */
  @Patch(':studentId')
  async setActive(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentActiveDto,
  ) {
    return this.studentsService.setStudentActive(id, studentId, dto.active);
  }
}
