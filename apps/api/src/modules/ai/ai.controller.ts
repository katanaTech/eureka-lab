import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
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
import { AiGatewayService } from './ai-gateway.service';
import { ContentModerationService } from './content-moderation.service';
import { ModerationLogService } from './moderation-log.service';
import { UsageTrackerService } from './usage-tracker.service';
import { SubmitPromptDto } from './dto/submit-prompt.dto';
import { AssistantMessageDto } from './dto/assistant-message.dto';
import type { PlanType, LearningLevel } from '@eureka-lab/shared-types';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';

/**
 * AI Controller — handles prompt submission and SSE streaming.
 * CLAUDE.md Rule 1: All AI calls go through NestJS gateway (never frontend).
 *
 * Per api-contracts.md: POST /ai/prompt
 * Response: text/event-stream (SSE)
 */
@Controller('ai')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiGateway: AiGatewayService,
    private readonly moderation: ContentModerationService,
    private readonly moderationLog: ModerationLogService,
    private readonly usageTracker: UsageTrackerService,
    private readonly badgeService: BadgeService,
    private readonly streakService: StreakService,
  ) {}

  /**
   * Submit a prompt and receive an AI response via SSE streaming.
   *
   * @param dto - The prompt submission data
   * @param user - Authenticated user (from guard)
   * @param reply - Fastify reply (for SSE headers)
   */
  @Post('prompt')
  @Roles('child', 'parent', 'admin')
  async submitPrompt(
    @Body() dto: SubmitPromptDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    /* Determine user plan — default to 'free' for now */
    const plan: PlanType = (user as AuthenticatedUser & { plan?: PlanType }).plan ?? 'free';

    /* Check rate limit */
    const canRequest = await this.usageTracker.canMakeRequest(user.uid, plan);
    if (!canRequest) {
      reply.status(HttpStatus.TOO_MANY_REQUESTS).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Daily prompt limit reached. Upgrade your plan for more prompts.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    /* Moderate input */
    const inputCheck = this.moderation.moderateInput(dto.prompt);
    if (!inputCheck.passed) {
      /* Log the flagged input */
      await this.moderationLog.logModerationEvent(
        user.uid,
        dto.moduleId,
        dto.prompt,
        'input',
        inputCheck.flags,
      );

      reply.status(HttpStatus.BAD_REQUEST).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Your prompt contains content that cannot be processed. Please try a different prompt.',
        code: 'MODERATION_BLOCKED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    /* Extract level from moduleId (e.g., 'l1-m1-...' → 1) */
    const level = this.extractLevel(dto.moduleId);

    /* Set up SSE response headers */
    reply.raw.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let totalTokens = 0;
    let fullResponse = '';

    try {
      const stream = this.aiGateway.streamResponse({
        prompt: dto.prompt,
        context: dto.context,
        level,
        moduleId: dto.moduleId,
        userId: user.uid,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          /* Accumulate for output moderation */
          fullResponse += chunk.content;

          /* Check output moderation periodically (every 200 chars) */
          if (fullResponse.length % 200 < 10) {
            const outputCheck = this.moderation.moderateOutput(fullResponse);
            if (!outputCheck.passed) {
              await this.moderationLog.logModerationEvent(
                user.uid,
                dto.moduleId,
                fullResponse,
                'output',
                outputCheck.flags,
              );
              reply.raw.write(
                `data: ${JSON.stringify({
                  type: 'error',
                  code: 'MODERATION_BLOCKED',
                  message: 'The AI response was flagged by content moderation.',
                })}\n\n`,
              );
              reply.raw.end();
              return;
            }
          }

          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'done') {
          totalTokens = chunk.tokensUsed ?? 0;

          /* Final output moderation check */
          const finalCheck = this.moderation.moderateOutput(fullResponse);
          if (!finalCheck.passed) {
            await this.moderationLog.logModerationEvent(
              user.uid,
              dto.moduleId,
              fullResponse,
              'output',
              finalCheck.flags,
            );
            reply.raw.write(
              `data: ${JSON.stringify({
                type: 'error',
                code: 'MODERATION_BLOCKED',
                message: 'The AI response was flagged by content moderation.',
              })}\n\n`,
            );
          } else {
            reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }

          /* Record usage */
          await this.usageTracker.recordUsage(user.uid, totalTokens);

          /* Gamification: record prompt for streak + badge tracking */
          await Promise.all([
            this.streakService.recordDailyActivity(user.uid, 0, true),
            this.streakService.updateStreak(user.uid),
            this.badgeService.recordPromptStats(user.uid, {
              promptScore: chunk.promptScore,
              hasContext: !!dto.context,
              activityType: 'prompt_exercise',
            }),
            this.badgeService.checkAndAwardBadges(user.uid, {
              type: 'prompt_sent',
              promptScore: chunk.promptScore,
            }),
          ]);
        } else if (chunk.type === 'error') {
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Streaming error';
      this.logger.error({
        event: 'ai_stream_error',
        userId: user.uid,
        error: message,
      });
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          code: 'AI_SERVICE_ERROR',
          message: 'An error occurred while generating the response.',
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }

  /**
   * Mobile AI assistant endpoint — Socratic learning helper.
   * Uses a dedicated system prompt that encourages guided learning.
   * CLAUDE.md Rule 11: Child safety preamble included via streamChat.
   * CLAUDE.md Rule 14: Token budget 500 (L1 budget for assistant).
   *
   * @param dto - The assistant message data
   * @param user - Authenticated user (from guard)
   * @param reply - Fastify reply (for SSE headers)
   */
  @Post('assistant')
  @Roles('child', 'parent', 'admin')
  async assistantChat(
    @Body() dto: AssistantMessageDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const plan: PlanType = (user as AuthenticatedUser & { plan?: PlanType }).plan ?? 'free';

    /* Check rate limit */
    const canRequest = await this.usageTracker.canMakeRequest(user.uid, plan);
    if (!canRequest) {
      reply.status(HttpStatus.TOO_MANY_REQUESTS).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Daily prompt limit reached. Upgrade your plan for more prompts.',
        code: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    /* Moderate input */
    const inputCheck = this.moderation.moderateInput(dto.message);
    if (!inputCheck.passed) {
      await this.moderationLog.logModerationEvent(
        user.uid,
        'assistant',
        dto.message,
        'input',
        inputCheck.flags,
      );

      reply.status(HttpStatus.BAD_REQUEST).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Your message contains content that cannot be processed.',
        code: 'MODERATION_BLOCKED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    /* Build context string */
    const contextParts: string[] = [];
    if (dto.context?.currentRoute) {
      contextParts.push(`The student is currently on: ${dto.context.currentRoute}`);
    }
    if (dto.context?.moduleId) {
      contextParts.push(`Working on module: ${dto.context.moduleId}`);
    }
    if (dto.context?.activityIndex !== undefined) {
      contextParts.push(`Activity index: ${dto.context.activityIndex}`);
    }

    const assistantSystemPrompt =
      'You are a friendly AI learning assistant for children aged 8-16 who are learning about AI. '
      + 'Use the Socratic method: ask guiding questions rather than giving direct answers. '
      + 'Keep responses short (2-3 sentences max), encouraging, and age-appropriate. '
      + 'If the student is stuck, give hints rather than full solutions. '
      + 'Celebrate their progress and curiosity. '
      + 'Never provide harmful, inappropriate, or off-topic content. '
      + (contextParts.length > 0
        ? `\n\nContext: ${contextParts.join('. ')}.`
        : '');

    /* Set up SSE response headers */
    reply.raw.writeHead(HttpStatus.OK, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let fullResponse = '';

    try {
      /* Use streamChat with the Socratic system prompt, L1 token budget (500) */
      const stream = this.aiGateway.streamChat(
        assistantSystemPrompt,
        [{ role: 'user', content: dto.message }],
        500,
        user.uid,
      );

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          fullResponse += chunk.content;

          /* Periodic output moderation */
          if (fullResponse.length % 200 < 10) {
            const outputCheck = this.moderation.moderateOutput(fullResponse);
            if (!outputCheck.passed) {
              await this.moderationLog.logModerationEvent(
                user.uid,
                'assistant',
                fullResponse,
                'output',
                outputCheck.flags,
              );
              reply.raw.write(
                `data: ${JSON.stringify({
                  type: 'error',
                  code: 'MODERATION_BLOCKED',
                  message: 'The response was flagged by content moderation.',
                })}\n\n`,
              );
              reply.raw.end();
              return;
            }
          }

          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } else if (chunk.type === 'done') {
          /* Final output moderation */
          const finalCheck = this.moderation.moderateOutput(fullResponse);
          if (!finalCheck.passed) {
            await this.moderationLog.logModerationEvent(
              user.uid,
              'assistant',
              fullResponse,
              'output',
              finalCheck.flags,
            );
            reply.raw.write(
              `data: ${JSON.stringify({
                type: 'error',
                code: 'MODERATION_BLOCKED',
                message: 'The response was flagged by content moderation.',
              })}\n\n`,
            );
          } else {
            reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }

          /* Record usage */
          await this.usageTracker.recordUsage(user.uid, chunk.tokensUsed ?? 0);
        } else if (chunk.type === 'error') {
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Streaming error';
      this.logger.error({
        event: 'ai_assistant_error',
        userId: user.uid,
        error: message,
      });
      reply.raw.write(
        `data: ${JSON.stringify({
          type: 'error',
          code: 'AI_SERVICE_ERROR',
          message: 'An error occurred while generating the response.',
        })}\n\n`,
      );
    } finally {
      reply.raw.end();
    }
  }

  /**
   * Extract the learning level from a module ID.
   * Module IDs follow the format: l{level}-m{number}-{slug}
   *
   * @param moduleId - Module identifier
   * @returns Learning level (1–4), defaults to 1
   */
  private extractLevel(moduleId: string): LearningLevel {
    const match = /^l(\d)/.exec(moduleId);
    if (match) {
      const level = parseInt(match[1], 10);
      if (level >= 1 && level <= 4) return level as LearningLevel;
    }
    return 1;
  }
}
