import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import type { ChatMessage } from '../ai/ai-gateway.service';
import { ContentModerationService } from '../ai/content-moderation.service';
import type {
  AgentDocument,
  AgentPersona,
  AgentChatChunk,
} from '@eureka-lab/shared-types';
import {
  TOKEN_BUDGETS,
  findAgentTemplateById,
} from '@eureka-lab/shared-types';

/** Parameters for creating a new agent */
export interface CreateAgentParams {
  /** Agent display name */
  name: string;
  /** Description of what the agent does */
  description: string;
  /** Template ID this agent is based on */
  templateId: string;
  /** Agent persona configuration */
  persona: AgentPersona;
}

/** Parameters for updating an agent */
export interface UpdateAgentParams {
  /** Updated agent name */
  name?: string;
  /** Updated description */
  description?: string;
  /** Updated persona configuration */
  persona?: AgentPersona;
}

/** Maximum number of agents per user */
const MAX_AGENTS_PER_USER = 10;

/** Maximum conversation history messages accepted */
const MAX_HISTORY_MESSAGES = 20;

/**
 * Service for managing user-owned buddy agents.
 * Firestore subcollection: users/{userId}/agents/{agentId}
 * CLAUDE.md Rule 3: All Firestore queries include userId filter.
 * CLAUDE.md Rule 12: All user-generated content must pass moderation.
 * CLAUDE.md Rule 14: Token budget (1000) enforced for Level 4.
 */
@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly aiGateway: AiGatewayService,
    private readonly moderation: ContentModerationService,
  ) {}

  /**
   * Get the agents subcollection reference for a user.
   * @param userId - User UID
   * @returns Firestore collection reference
   */
  private agentsRef(userId: string) {
    return this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('agents');
  }

  /**
   * Create a new agent from a template.
   * Validates content via moderation before saving.
   *
   * @param userId - User UID
   * @param params - Agent creation parameters
   * @returns Created agent document
   */
  async createAgent(
    userId: string,
    params: CreateAgentParams,
  ): Promise<AgentDocument> {
    /* Validate template exists */
    const template = findAgentTemplateById(params.templateId);
    if (!template) {
      throw new BadRequestException(
        `Unknown template ID: ${params.templateId}`,
      );
    }

    /* Enforce agent limit per user */
    const existingCount = await this.agentsRef(userId)
      .count()
      .get();
    if (existingCount.data().count >= MAX_AGENTS_PER_USER) {
      throw new BadRequestException(
        `Maximum of ${MAX_AGENTS_PER_USER} agents per user`,
      );
    }

    /* Moderate all text fields */
    this.moderatePersonaFields(params.name, params.description, params.persona);

    /* Create the agent document */
    const docRef = this.agentsRef(userId).doc();
    const now = new Date().toISOString();
    const agent: AgentDocument = {
      id: docRef.id,
      userId,
      name: params.name,
      description: params.description,
      templateId: params.templateId,
      persona: params.persona,
      createdAt: now,
      chatCount: 0,
    };

    await docRef.set(agent);

    this.logger.log({
      event: 'agent_created',
      userId,
      agentId: agent.id,
      templateId: params.templateId,
    });

    return agent;
  }

  /**
   * List all agents for a user.
   *
   * @param userId - User UID
   * @returns Array of agent documents
   */
  async getUserAgents(userId: string): Promise<AgentDocument[]> {
    const snapshot = await this.agentsRef(userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as AgentDocument);
  }

  /**
   * Get a single agent by ID.
   *
   * @param userId - User UID
   * @param agentId - Agent document ID
   * @returns Agent document
   */
  async getAgent(
    userId: string,
    agentId: string,
  ): Promise<AgentDocument> {
    const doc = await this.agentsRef(userId).doc(agentId).get();

    if (!doc.exists) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    return doc.data() as AgentDocument;
  }

  /**
   * Update an agent's configuration.
   * Validates via moderation before saving.
   *
   * @param userId - User UID
   * @param agentId - Agent document ID
   * @param params - Updated agent data
   * @returns Updated agent document
   */
  async updateAgent(
    userId: string,
    agentId: string,
    params: UpdateAgentParams,
  ): Promise<AgentDocument> {
    const existing = await this.getAgent(userId, agentId);

    /* Moderate updated text fields */
    const name = params.name ?? existing.name;
    const description = params.description ?? existing.description;
    const persona = params.persona ?? existing.persona;
    this.moderatePersonaFields(name, description, persona);

    const updated: AgentDocument = {
      ...existing,
      name,
      description,
      persona,
    };

    await this.agentsRef(userId).doc(agentId).set(updated);

    this.logger.log({
      event: 'agent_updated',
      userId,
      agentId,
    });

    return updated;
  }

  /**
   * Chat with an agent via SSE streaming.
   * Builds a custom system prompt from the agent's persona and sends
   * the conversation history to the AI gateway.
   *
   * CLAUDE.md Rule 1: AI calls go through NestJS gateway.
   * CLAUDE.md Rule 11: Safety preamble included via gateway.
   * CLAUDE.md Rule 14: Token budget 1000 for Level 4.
   *
   * @param userId - User UID
   * @param agentId - Agent document ID
   * @param userMessage - New user message
   * @param history - Previous conversation messages
   * @yields AgentChatChunk events
   */
  async *chatWithAgent(
    userId: string,
    agentId: string,
    userMessage: string,
    history: ChatMessage[],
  ): AsyncGenerator<AgentChatChunk> {
    const agent = await this.getAgent(userId, agentId);

    /* Moderate the user message */
    const messageCheck = this.moderation.moderateInput(userMessage);
    if (!messageCheck.passed) {
      yield {
        type: 'error',
        code: 'MODERATION_BLOCKED',
        message: 'Your message contains content that cannot be processed.',
      };
      return;
    }

    /* Validate history length */
    if (history.length > MAX_HISTORY_MESSAGES) {
      yield {
        type: 'error',
        code: 'HISTORY_TOO_LONG',
        message: `Maximum ${MAX_HISTORY_MESSAGES} messages in conversation history.`,
      };
      return;
    }

    /* Build custom system prompt from agent persona */
    const customSystemPrompt = this.buildAgentSystemPrompt(agent.persona);

    /* Build full message list: history + new user message */
    const messages: ChatMessage[] = [
      ...history,
      { role: 'user', content: userMessage },
    ];

    /* Signal chat start */
    yield { type: 'message_start' };

    let fullResponse = '';
    const maxTokens = TOKEN_BUDGETS[4];

    try {
      const stream = this.aiGateway.streamChat(
        customSystemPrompt,
        messages,
        maxTokens,
        userId,
      );

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          fullResponse += chunk.content;

          yield {
            type: 'message_token',
            content: chunk.content,
          };

          /* Periodic output moderation */
          if (fullResponse.length % 200 < 10) {
            const outCheck = this.moderation.moderateOutput(fullResponse);
            if (!outCheck.passed) {
              yield {
                type: 'error',
                code: 'MODERATION_BLOCKED',
                message: 'Agent response was flagged by content moderation.',
              };
              return;
            }
          }
        }
      }

      /* Final output moderation */
      const finalCheck = this.moderation.moderateOutput(fullResponse);
      if (!finalCheck.passed) {
        yield {
          type: 'error',
          code: 'MODERATION_BLOCKED',
          message: 'Agent response was flagged by content moderation.',
        };
        return;
      }

      yield {
        type: 'message_done',
        fullMessage: fullResponse,
      };

      /* Update chat count */
      await this.agentsRef(userId)
        .doc(agentId)
        .update({
          chatCount: (agent.chatCount ?? 0) + 1,
          lastChatAt: new Date().toISOString(),
        });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Agent chat error';
      this.logger.error({
        event: 'agent_chat_error',
        userId,
        agentId,
        error: message,
      });
      yield {
        type: 'error',
        code: 'CHAT_ERROR',
        message: `Error during agent chat: ${message}`,
      };
    }

    this.logger.log({
      event: 'agent_chat_complete',
      userId,
      agentId,
      responseLength: fullResponse.length,
    });
  }

  /**
   * Delete an agent.
   *
   * @param userId - User UID
   * @param agentId - Agent document ID
   */
  async deleteAgent(
    userId: string,
    agentId: string,
  ): Promise<void> {
    const doc = await this.agentsRef(userId).doc(agentId).get();
    if (!doc.exists) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    await this.agentsRef(userId).doc(agentId).delete();

    this.logger.log({
      event: 'agent_deleted',
      userId,
      agentId,
    });
  }

  /**
   * Build a custom system prompt from an agent's persona configuration.
   * CLAUDE.md Rule 11: Safety preamble is added by the AI gateway.
   * CLAUDE.md Rule 13: No child profile data in AI prompts.
   *
   * @param persona - Agent persona configuration
   * @returns Custom system prompt string
   */
  private buildAgentSystemPrompt(persona: AgentPersona): string {
    const parts: string[] = [
      `You are ${persona.name}. ${persona.systemPrompt}`,
    ];

    if (persona.knowledgeBase.trim()) {
      parts.push(`\nKnowledge: ${persona.knowledgeBase}`);
    }

    if (persona.goals.length > 0) {
      parts.push(`\nGoals: ${persona.goals.join('. ')}`);
    }

    if (persona.guardrails.length > 0) {
      parts.push(`\nRules you must follow: ${persona.guardrails.join('. ')}`);
    }

    parts.push(
      '\nRemember: You are talking to a child (8-16 years old). ' +
        'Be friendly, encouraging, and age-appropriate. ' +
        'Keep responses concise and engaging.',
    );

    return parts.join('\n');
  }

  /**
   * Moderate all text fields in a persona to ensure child safety.
   * CLAUDE.md Rule 12: All user-generated content must pass moderation.
   *
   * @param name - Agent name
   * @param description - Agent description
   * @param persona - Agent persona object
   */
  private moderatePersonaFields(
    name: string,
    description: string,
    persona: AgentPersona,
  ): void {
    const nameCheck = this.moderation.moderateInput(name);
    if (!nameCheck.passed) {
      throw new BadRequestException(
        'Agent name contains inappropriate content',
      );
    }

    const descCheck = this.moderation.moderateInput(description);
    if (!descCheck.passed) {
      throw new BadRequestException(
        'Agent description contains inappropriate content',
      );
    }

    const promptCheck = this.moderation.moderateInput(persona.systemPrompt);
    if (!promptCheck.passed) {
      throw new BadRequestException(
        'Agent personality contains inappropriate content',
      );
    }

    if (persona.knowledgeBase.trim()) {
      const kbCheck = this.moderation.moderateInput(persona.knowledgeBase);
      if (!kbCheck.passed) {
        throw new BadRequestException(
          'Agent knowledge base contains inappropriate content',
        );
      }
    }

    for (const goal of persona.goals) {
      const goalCheck = this.moderation.moderateInput(goal);
      if (!goalCheck.passed) {
        throw new BadRequestException(
          'One of the agent goals contains inappropriate content',
        );
      }
    }

    for (const guardrail of persona.guardrails) {
      const grCheck = this.moderation.moderateInput(guardrail);
      if (!grCheck.passed) {
        throw new BadRequestException(
          'One of the agent guardrails contains inappropriate content',
        );
      }
    }
  }
}
