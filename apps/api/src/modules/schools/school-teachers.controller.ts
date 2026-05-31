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
import { SchoolTeachersService } from './school-teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherActiveDto } from './dto/update-teacher-active.dto';

/**
 * School-admin teacher management, scoped to the caller's own school by
 * TenantGuard (super_admin bypasses). Base route: /schools/:id/teachers.
 */
@Controller('schools/:id/teachers')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
export class SchoolTeachersController {
  constructor(private readonly teachersService: SchoolTeachersService) {}

  /**
   * Mint a teacher in this school.
   * @param id - School id.
   * @param dto - Teacher data.
   * @returns The minted teacher.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('id') id: string, @Body() dto: CreateTeacherDto) {
    return this.teachersService.createTeacher(id, dto);
  }

  /**
   * List this school's teachers.
   * @param id - School id.
   * @returns { teachers }.
   */
  @Get()
  async list(@Param('id') id: string) {
    return { teachers: await this.teachersService.listTeachers(id) };
  }

  /**
   * Activate / deactivate a teacher.
   * @param id - School id.
   * @param teacherId - Teacher uid.
   * @param dto - { active }.
   * @returns The updated teacher summary.
   */
  @Patch(':teacherId')
  async setActive(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string,
    @Body() dto: UpdateTeacherActiveDto,
  ) {
    return this.teachersService.setTeacherActive(id, teacherId, dto.active);
  }
}
