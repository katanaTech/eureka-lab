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
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

/**
 * Super-admin-only endpoints for managing school tenants.
 * Routes: POST/GET /schools, GET /schools/:id, POST /schools/:id/admins.
 */
@Controller('schools')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('super_admin')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  /**
   * Create a new school tenant.
   * @param user - Authenticated super_admin.
   * @param dto - School creation data.
   * @returns The created school.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSchool(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSchoolDto) {
    return this.schoolsService.createSchool(user.uid, dto);
  }

  /**
   * List all schools as summaries.
   * @returns Array of school summaries.
   */
  @Get()
  async listSchools() {
    return { schools: await this.schoolsService.listSchools() };
  }

  /**
   * Get one school by id.
   * @param id - School id.
   * @returns The school document.
   */
  @Get(':id')
  async getSchool(@Param('id') id: string) {
    return this.schoolsService.getSchool(id);
  }

  /**
   * Update a school's status and/or seat limit.
   * @param id - School id.
   * @param dto - Partial update.
   * @returns The updated school.
   */
  @Patch(':id')
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolsService.updateSchool(id, dto);
  }

  /**
   * List a school's admins (resolved summaries).
   * @param id - School id.
   * @returns { admins }.
   */
  @Get(':id/admins')
  async listSchoolAdmins(@Param('id') id: string) {
    return { admins: await this.schoolsService.listSchoolAdmins(id) };
  }

  /**
   * Mint the first school_admin for a school.
   * @param id - School id.
   * @param dto - Admin account data.
   * @returns The minted admin summary.
   */
  @Post(':id/admins')
  @HttpCode(HttpStatus.CREATED)
  async createSchoolAdmin(@Param('id') id: string, @Body() dto: CreateSchoolAdminDto) {
    return this.schoolsService.mintSchoolAdmin(id, dto);
  }
}
