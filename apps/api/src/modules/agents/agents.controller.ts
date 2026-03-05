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
import { AgentsService } from './agents.service';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { ChatMessageDto } from './dto/chat-message.dto';

/**
 * Agents controller — CRUD and AI chat for Level 4 Buddy Agents.
 * CLAUDE.md Rule 1: All AI calls go through NestJS gateway (via AgentsService).
 *
 * Endpoints:
 * - POST   /agents            — create an agent
 * - GET    /agents            — list user's agents
 * - GET    /agents/:id        — get single agent
 * - PUT    /agents/:id        — update agent config
 * - POST   /agents/:id/chat   — chat with agent (SSE stream)
 * - DELETE /agents/:id        — delete an agent
 */
@Controller('agents')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name);

  constructor(
    private readonly agentsService: AgentsService,
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
  ) {}

  /**
   * Create a new agent from a template.
   *
   * @param dto - Agent creation data
   * @param user - Authenticated user
   * @returns Created agent document
   */
  @Post()
  @Roles('child', 'parent', 'admin')
  async createAgent(
    @Body() dto: CreateAgentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const agent = await this.agentsService.createAgent(user.uid, dto);

    /* Gamification: track agent creation */
    await Promise.all([
      this.streakService.recordDailyActivity(user.uid, 0, false),
      this.streakService.updateStreak(user.uid),
      this.badgeService.checkAndAwardBadges(user.uid, {
        type: 'agent_created',
        templateId: dto.templateId,
      }),
    ]);

    return agent;
  }

  /**
   * List all agents for the authenticated user.
   *
   * @param user - Authenticated user
   * @returns Array of agents
   */
  @Get()
  @Roles('child', 'parent', 'admin')
  async listAgents(@CurrentUser() user: AuthenticatedUser) {
    const agents = await this.agentsService.getUserAgents(user.uid);
    return { agents };
  }

  /**
   * Get a single agent by ID.
   *
   * @param id - Agent document ID
   * @param user - Authenticated user
   * @returns Full agent document
   */
  @Get(':id')
  @Roles('child', 'parent', 'admin')
  async getAgent(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.getAgent(user.uid, id);
  }

  /**
   * Update an agent's configuration.
   *
   * @param id - Agent document ID
   * @param dto - Updated agent data
   * @param user - Authenticated user
   * @returns Updated agent document
   */
  @Put(':id')
  @Roles('child', 'parent', 'admin')
  async updateAgent(
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.agentsService.updateAgent(user.uid, id, dto);
  }

  /**
   * Chat with an agent via SSE streaming.
   * Returns streaming events: message_start → message_token* → message_done | error.
   *
   * @param id - Agent document ID
   * @param dto - Chat message and history
   * @param user - Authenticated user
   * @param reply - Fastify reply for SSE headers
   */
  @Post(':id/chat')
  @Roles('child', 'parent', 'admin')
  async chatWithAgent(
    @Param('id') id: string,
    @Body() dto: ChatMessageDto,
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
      const stream = this.agentsService.chatWithAgent(
        user.uid,
        id,
        dto.message,
        dto.history,
      );

      for await (const chunk of stream) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);

        /* On chat completion, trigger gamification */
        if (chunk.type === 'message_done') {
          await Promise.all([
            this.streakService.recordDailyActivity(user.uid, 0, false),
            this.streakService.updateStreak(user.uid),
            this.badgeService.checkAndAwardBadges(user.uid, {
              type: 'agent_chat',
            }),
          ]);
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Agent chat error';
      this.logger.error({
        event: 'agent_chat_error',
        userId: user.uid,
        agentId: id,
        error: message,
      });
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          code: 'CHAT_ERROR',
          message: 'An error occurred during agent chat.',
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }

  /**
   * Delete an agent.
   *
   * @param id - Agent document ID
   * @param user - Authenticated user
   */
  @Delete(':id')
  @Roles('child', 'parent', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAgent(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.agentsService.deleteAgent(user.uid, id);
  }
}
