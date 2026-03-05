import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { SAFETY_PREAMBLE, LEVEL_PROMPTS } from '@eureka-lab/ai-prompts';

import type { LearningLevel } from '@eureka-lab/shared-types';
import { TOKEN_BUDGETS } from '@eureka-lab/shared-types';

/** A single message in a multi-turn conversation */
export interface ChatMessage {
  /** Message sender role */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
}

/** Parameters for generating an AI response */
export interface AiPromptParams {
  /** The user's prompt text */
  prompt: string;
  /** Optional additional context */
  context?: string;
  /** Learning level (1–4) */
  level: LearningLevel;
  /** Module identifier */
  moduleId: string;
  /** Authenticated user UID */
  userId: string;
}

/** Shape of each SSE chunk emitted by the stream */
export interface AiStreamChunk {
  /** Chunk type */
  type: 'token' | 'done' | 'error';
  /** Text content (for token type) */
  content?: string;
  /** Prompt quality score 0–1 (for done type) */
  promptScore?: number;
  /** Tokens consumed (for done type) */
  tokensUsed?: number;
  /** Error code (for error type) */
  code?: string;
  /** Error message (for error type) */
  message?: string;
}

/**
 * AI Gateway service — the single abstraction layer for all AI API calls.
 * CLAUDE.md Rule 1: All AI calls go through NestJS gateway.
 * CLAUDE.md Rule 18: All third-party SDKs go through an abstraction layer.
 * CLAUDE.md Rule 14: Token budgets per level MUST be enforced.
 */
@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private client: Anthropic | undefined;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log({ event: 'ai_gateway_init', status: 'connected' });
    } else {
      this.logger.warn({
        event: 'ai_gateway_init',
        status: 'no_api_key',
        message: 'ANTHROPIC_API_KEY not set — AI calls will return mock responses',
      });
    }
  }

  /**
   * Build the full system prompt for a given level.
   * CLAUDE.md Rule 11: All AI system prompts must include the child safety preamble.
   * CLAUDE.md Rule 13: No child profile data in AI prompts.
   *
   * @param level - Learning level (1–4)
   * @returns Combined system prompt
   */
  buildSystemPrompt(level: LearningLevel): string {
    return `${SAFETY_PREAMBLE}\n\n${LEVEL_PROMPTS[level]}`;
  }

  /**
   * Get the max output tokens allowed for a given level.
   * CLAUDE.md Rule 14: Token budgets per level MUST be enforced.
   *
   * @param level - Learning level
   * @returns Maximum output token count
   */
  getTokenBudget(level: LearningLevel): number {
    return TOKEN_BUDGETS[level];
  }

  /**
   * Generate an AI response as an async generator (for SSE streaming).
   * Yields AiStreamChunk objects for each piece of the response.
   *
   * @param params - Prompt parameters
   * @yields AiStreamChunk objects
   */
  async *streamResponse(
    params: AiPromptParams,
  ): AsyncGenerator<AiStreamChunk> {
    const { prompt, context, level } = params;
    const systemPrompt = this.buildSystemPrompt(level);
    const maxTokens = this.getTokenBudget(level);

    const userMessage = context
      ? `Context: ${context}\n\nPrompt: ${prompt}`
      : prompt;

    this.logger.log({
      event: 'ai_request_start',
      userId: params.userId,
      moduleId: params.moduleId,
      level,
      promptLength: prompt.length,
    });

    /* If no API key, return a mock response for development */
    if (!this.client) {
      yield* this.mockStream(prompt, level);
      return;
    }

    try {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      let totalTokens = 0;

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { type: 'token', content: event.delta.text };
        }
      }

      /* Get final usage from the stream */
      const finalMessage = await stream.finalMessage();
      totalTokens = finalMessage.usage.output_tokens;

      /* Calculate prompt quality score */
      const promptScore = this.scorePrompt(prompt, context);

      yield {
        type: 'done',
        promptScore,
        tokensUsed: totalTokens,
      };

      this.logger.log({
        event: 'ai_request_complete',
        userId: params.userId,
        moduleId: params.moduleId,
        tokensUsed: totalTokens,
        promptScore,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'AI service error';
      this.logger.error({
        event: 'ai_request_error',
        userId: params.userId,
        error: message,
      });
      yield { type: 'error', code: 'AI_SERVICE_ERROR', message };
    }
  }

  /**
   * Stream a multi-turn chat with a custom system prompt.
   * Used by Level 4 Buddy Agents where children design custom agent personas.
   * Unlike streamResponse(), this accepts a custom system prompt and full
   * conversation history instead of level-based prompts with a single message.
   *
   * CLAUDE.md Rule 1: All AI calls go through NestJS gateway.
   * CLAUDE.md Rule 11: Safety preamble is prepended to the custom system prompt.
   * CLAUDE.md Rule 14: Token budget enforced via maxTokens parameter.
   *
   * @param customSystemPrompt - Agent persona system prompt (combined with safety preamble)
   * @param messages - Conversation history (user/assistant turns)
   * @param maxTokens - Maximum output tokens per response
   * @param userId - Authenticated user UID (for logging only, not sent to API)
   * @yields AiStreamChunk objects
   */
  async *streamChat(
    customSystemPrompt: string,
    messages: ChatMessage[],
    maxTokens: number,
    userId: string,
  ): AsyncGenerator<AiStreamChunk> {
    const systemPrompt = `${SAFETY_PREAMBLE}\n\n${customSystemPrompt}`;

    this.logger.log({
      event: 'ai_chat_start',
      userId,
      messageCount: messages.length,
      maxTokens,
    });

    /* If no API key, return a mock response for development */
    if (!this.client) {
      yield* this.mockChatStream(messages);
      return;
    }

    try {
      const stream = this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      let totalTokens = 0;

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield { type: 'token', content: event.delta.text };
        }
      }

      /* Get final usage from the stream */
      const finalMessage = await stream.finalMessage();
      totalTokens = finalMessage.usage.output_tokens;

      yield {
        type: 'done',
        tokensUsed: totalTokens,
      };

      this.logger.log({
        event: 'ai_chat_complete',
        userId,
        tokensUsed: totalTokens,
        messageCount: messages.length,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'AI chat service error';
      this.logger.error({
        event: 'ai_chat_error',
        userId,
        error: message,
      });
      yield { type: 'error', code: 'AI_CHAT_ERROR', message };
    }
  }

  /**
   * Score a prompt on quality (0–1).
   * Heuristic scoring based on length, specificity, and context presence.
   *
   * @param prompt - The user's prompt text
   * @param context - Optional context string
   * @returns Score between 0 and 1
   */
  scorePrompt(prompt: string, context?: string): number {
    let score = 0;
    const words = prompt.trim().split(/\s+/).length;

    /* Length scoring: reward prompts between 10–100 words */
    if (words >= 10) score += 0.2;
    if (words >= 20) score += 0.1;
    if (words >= 5 && words <= 150) score += 0.1;

    /* Specificity: contains question words or action verbs */
    const specificityPattern =
      /\b(how|why|what|explain|describe|compare|create|build|show|list|analyze)\b/i;
    if (specificityPattern.test(prompt)) score += 0.2;

    /* Context presence */
    if (context && context.trim().length > 10) score += 0.15;

    /* Structure: contains punctuation suggesting structured thought */
    if (/[.!?]/.test(prompt)) score += 0.1;

    /* Contains examples or constraints */
    if (/\b(for example|such as|like|e\.g\.|including|between|at least|no more than)\b/i.test(prompt)) {
      score += 0.15;
    }

    return Math.min(1, Math.round(score * 100) / 100);
  }

  /**
   * Mock streaming response for development without an API key.
   *
   * @param prompt - The user's prompt
   * @param level - Learning level
   * @yields Mock AiStreamChunk objects
   */
  private async *mockStream(
    prompt: string,
    level: LearningLevel,
  ): AsyncGenerator<AiStreamChunk> {
    const mockResponse = `This is a mock AI response for Level ${level}. `
      + `In production, this would be a real response from Claude. `
      + `Your prompt was ${prompt.length} characters long. `
      + `Try writing more specific prompts with context for better results!`;

    const words = mockResponse.split(' ');
    for (const word of words) {
      yield { type: 'token', content: `${word} ` };
      /* Simulate streaming delay */
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    yield {
      type: 'done',
      promptScore: this.scorePrompt(prompt),
      tokensUsed: words.length * 2,
    };
  }

  /**
   * Mock chat streaming response for development without an API key.
   *
   * @param messages - Conversation history
   * @yields Mock AiStreamChunk objects
   */
  private async *mockChatStream(
    messages: ChatMessage[],
  ): AsyncGenerator<AiStreamChunk> {
    const lastMessage = messages[messages.length - 1];
    const mockResponse = `This is a mock agent response. `
      + `In production, your agent would respond based on its persona. `
      + `You said: "${lastMessage?.content.slice(0, 50) ?? ''}" `
      + `(${messages.length} messages in conversation)`;

    const words = mockResponse.split(' ');
    for (const word of words) {
      yield { type: 'token', content: `${word} ` };
      /* Simulate streaming delay */
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    yield {
      type: 'done',
      tokensUsed: words.length * 2,
    };
  }
}
