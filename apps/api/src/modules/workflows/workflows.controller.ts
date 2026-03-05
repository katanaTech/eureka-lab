import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
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
import { WorkflowsService } from './workflows.service';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { RunWorkflowDto } from './dto/run-workflow.dto';

/**
 * Workflows controller — CRUD and execution for Level 2 workflows.
 * CLAUDE.md Rule 1: All AI calls go through NestJS gateway (via WorkflowsService).
 *
 * Endpoints:
 * - POST /workflows          — create a workflow
 * - GET  /workflows          — list user's workflows
 * - GET  /workflows/:id      — get single workflow
 * - POST /workflows/:id/run  — execute workflow (SSE stream)
 * - DELETE /workflows/:id    — delete a workflow
 */
@Controller('workflows')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class WorkflowsController {
  private readonly logger = new Logger(WorkflowsController.name);

  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
  ) {}

  /**
   * Create a new workflow from a template.
   *
   * @param dto - Workflow creation data
   * @param user - Authenticated user
   * @returns Created workflow document
   */
  @Post()
  @Roles('child', 'parent', 'admin')
  async createWorkflow(
    @Body() dto: CreateWorkflowDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const workflow = await this.workflowsService.createWorkflow(user.uid, dto);

    /* Gamification: track workflow creation */
    await Promise.all([
      this.streakService.recordDailyActivity(user.uid, 0, false),
      this.streakService.updateStreak(user.uid),
      this.badgeService.checkAndAwardBadges(user.uid, {
        type: 'workflow_created',
        templateId: dto.templateId,
      }),
    ]);

    return workflow;
  }

  /**
   * List all workflows for the authenticated user.
   *
   * @param user - Authenticated user
   * @param templateId - Optional filter by template
   * @returns Array of workflows
   */
  @Get()
  @Roles('child', 'parent', 'admin')
  async listWorkflows(
    @CurrentUser() user: AuthenticatedUser,
    @Query('templateId') templateId?: string,
  ) {
    const workflows = await this.workflowsService.getUserWorkflows(
      user.uid,
      templateId,
    );
    return { workflows };
  }

  /**
   * Get a single workflow by ID.
   *
   * @param id - Workflow document ID
   * @param user - Authenticated user
   * @returns Full workflow document
   */
  @Get(':id')
  @Roles('child', 'parent', 'admin')
  async getWorkflow(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflowsService.getWorkflow(user.uid, id);
  }

  /**
   * Execute a workflow via SSE streaming.
   * Each step's tokens stream in real-time, followed by step completion events.
   *
   * @param id - Workflow document ID
   * @param dto - Run parameters (input text)
   * @param user - Authenticated user
   * @param reply - Fastify reply for SSE headers
   */
  @Post(':id/run')
  @Roles('child', 'parent', 'admin')
  async runWorkflow(
    @Param('id') id: string,
    @Body() dto: RunWorkflowDto,
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
      const stream = this.workflowsService.runWorkflow(
        user.uid,
        id,
        dto.input,
      );

      for await (const chunk of stream) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);

        /* On workflow completion, trigger gamification */
        if (chunk.type === 'workflow_done') {
          await Promise.all([
            this.streakService.recordDailyActivity(user.uid, 0, false),
            this.streakService.updateStreak(user.uid),
            this.badgeService.checkAndAwardBadges(user.uid, {
              type: 'workflow_run',
            }),
          ]);
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Workflow execution error';
      this.logger.error({
        event: 'workflow_run_error',
        userId: user.uid,
        workflowId: id,
        error: message,
      });
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          code: 'WORKFLOW_ERROR',
          message: 'An error occurred while running the workflow.',
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }

  /**
   * Delete a workflow.
   *
   * @param id - Workflow document ID
   * @param user - Authenticated user
   */
  @Delete(':id')
  @Roles('child', 'parent', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWorkflow(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.workflowsService.deleteWorkflow(user.uid, id);
  }
}
