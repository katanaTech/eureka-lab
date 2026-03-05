import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { GenerateCodeDto } from './dto/generate-code.dto';

/**
 * Projects controller — CRUD and AI code generation for Level 3.
 * CLAUDE.md Rule 1: All AI calls go through NestJS gateway (via ProjectsService).
 *
 * Endpoints:
 * - POST   /projects              — create a project
 * - GET    /projects              — list user's projects
 * - GET    /projects/:id          — get single project
 * - PUT    /projects/:id          — update project code
 * - POST   /projects/:id/generate — AI code generation (SSE stream)
 * - DELETE /projects/:id          — delete a project
 */
@Controller('projects')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
  ) {}

  /**
   * Create a new code project from a template.
   *
   * @param dto - Project creation data
   * @param user - Authenticated user
   * @returns Created project document
   */
  @Post()
  @Roles('child', 'parent', 'admin')
  async createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectsService.createProject(user.uid, dto);

    /* Gamification: track project creation */
    await Promise.all([
      this.streakService.recordDailyActivity(user.uid, 0, false),
      this.streakService.updateStreak(user.uid),
      this.badgeService.checkAndAwardBadges(user.uid, {
        type: 'project_created',
        templateId: dto.templateId,
      }),
    ]);

    return project;
  }

  /**
   * List all projects for the authenticated user.
   *
   * @param user - Authenticated user
   * @returns Array of projects
   */
  @Get()
  @Roles('child', 'parent', 'admin')
  async listProjects(@CurrentUser() user: AuthenticatedUser) {
    const projects = await this.projectsService.getUserProjects(user.uid);
    return { projects };
  }

  /**
   * Get a single project by ID.
   *
   * @param id - Project document ID
   * @param user - Authenticated user
   * @returns Full project document
   */
  @Get(':id')
  @Roles('child', 'parent', 'admin')
  async getProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.getProject(user.uid, id);
  }

  /**
   * Update a project's code files.
   *
   * @param id - Project document ID
   * @param dto - Updated code (html, css, js)
   * @param user - Authenticated user
   * @returns Updated project document
   */
  @Put(':id')
  @Roles('child', 'parent', 'admin')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.updateProject(user.uid, id, dto);
  }

  /**
   * Generate code via AI with SSE streaming.
   * Returns streaming events: code_start → code_token* → code_done | error.
   *
   * @param id - Project document ID
   * @param dto - Generation parameters (prompt + target file)
   * @param user - Authenticated user
   * @param reply - Fastify reply for SSE headers
   */
  @Post(':id/generate')
  @Roles('child', 'parent', 'admin')
  async generateCode(
    @Param('id') id: string,
    @Body() dto: GenerateCodeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    /* Set up SSE response headers */
    reply.raw.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const stream = this.projectsService.generateCode(
        user.uid,
        id,
        dto.prompt,
        dto.targetFile,
      );

      for await (const chunk of stream) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);

        /* On code generation completion, trigger gamification */
        if (chunk.type === 'code_done') {
          await Promise.all([
            this.streakService.recordDailyActivity(user.uid, 0, false),
            this.streakService.updateStreak(user.uid),
            this.badgeService.checkAndAwardBadges(user.uid, {
              type: 'code_generated',
            }),
          ]);
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Code generation error';
      this.logger.error({
        event: 'code_generation_error',
        userId: user.uid,
        projectId: id,
        error: message,
      });
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          code: 'GENERATION_ERROR',
          message: 'An error occurred during code generation.',
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }

  /**
   * Delete a project.
   *
   * @param id - Project document ID
   * @param user - Authenticated user
   */
  @Delete(':id')
  @Roles('child', 'parent', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.projectsService.deleteProject(user.uid, id);
  }
}
