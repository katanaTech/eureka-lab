import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SchoolClassroomsService } from './school-classrooms.service';

/**
 * School-admin read-only classroom rollup, scoped to the caller's own school by
 * TenantGuard (super_admin bypasses). Base route: /schools/:id/classrooms.
 */
@Controller('schools/:id/classrooms')
@UseGuards(FirebaseAuthGuard, RolesGuard, TenantGuard)
@Roles('school_admin', 'super_admin')
export class SchoolClassroomsController {
  constructor(private readonly classroomsService: SchoolClassroomsService) {}

  /**
   * List this school's classrooms as resolved summaries.
   * @param id - School id.
   * @returns { classrooms } rollup payload.
   */
  @Get()
  async list(@Param('id') id: string) {
    return { classrooms: await this.classroomsService.listSchoolClassrooms(id) };
  }
}
