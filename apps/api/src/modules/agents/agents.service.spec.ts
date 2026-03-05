import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import { ContentModerationService } from '../ai/content-moderation.service';
import type { AgentChatChunk, AgentPersona } from '@eureka-lab/shared-types';

/**
 * Unit tests for AgentsService.
 * Tests CRUD operations, content moderation, and SSE chat streaming.
 */
describe('AgentsService', () => {
  let service: AgentsService;

  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockCount = jest.fn();

  const mockDocRef = {
    id: 'agent-test-123',
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
  };

  const mockCollectionRef = {
    doc: jest.fn().mockReturnValue(mockDocRef),
    orderBy: jest.fn(),
    count: jest.fn().mockReturnValue({ get: mockCount }),
  };

  const mockFirebaseService = {
    firestore: {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue(mockCollectionRef),
        }),
      }),
    },
  };

  const mockModeration = {
    moderateInput: jest.fn().mockReturnValue({ passed: true, flags: [] }),
    moderateOutput: jest.fn().mockReturnValue({ passed: true, flags: [] }),
  };

  const mockAiGateway = {
    streamChat: jest.fn(),
  };

  /** Valid agent persona fixture */
  const validPersona: AgentPersona = {
    name: 'Buddy',
    systemPrompt: 'You are a friendly learning buddy.',
    knowledgeBase: 'Math and science',
    goals: ['Help with homework'],
    guardrails: ['Never give answers directly'],
  };

  /** Valid create params */
  const validCreateParams = {
    name: 'My Agent',
    description: 'A test agent',
    templateId: 'study-buddy',
    persona: validPersona,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AiGatewayService, useValue: mockAiGateway },
        { provide: ContentModerationService, useValue: mockModeration },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);

    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockCount.mockResolvedValue({ data: () => ({ count: 0 }) });
    mockCollectionRef.orderBy.mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    });
  });

  describe('createAgent', () => {
    it('should create an agent with valid data', async () => {
      const result = await service.createAgent('user-1', validCreateParams);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.name).toBe('My Agent');
      expect(result.templateId).toBe('study-buddy');
      expect(result.chatCount).toBe(0);
      expect(mockSet).toHaveBeenCalled();
    });

    it('should reject unknown templateId', async () => {
      await expect(
        service.createAgent('user-1', {
          ...validCreateParams,
          templateId: 'nonexistent-template',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when user has max agents', async () => {
      mockCount.mockResolvedValue({ data: () => ({ count: 10 }) });

      await expect(
        service.createAgent('user-1', validCreateParams),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when name fails moderation', async () => {
      mockModeration.moderateInput
        .mockReturnValueOnce({ passed: false, flags: ['harmful'] });

      await expect(
        service.createAgent('user-1', validCreateParams),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when description fails moderation', async () => {
      mockModeration.moderateInput
        .mockReturnValueOnce({ passed: true, flags: [] })
        .mockReturnValueOnce({ passed: false, flags: ['adult'] });

      await expect(
        service.createAgent('user-1', validCreateParams),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserAgents', () => {
    it('should return empty array for user with no agents', async () => {
      const result = await service.getUserAgents('user-1');
      expect(result).toEqual([]);
    });

    it('should return array of agent documents', async () => {
      const mockAgents = [
        { id: 'a-1', userId: 'user-1', name: 'Agent 1' },
        { id: 'a-2', userId: 'user-1', name: 'Agent 2' },
      ];
      mockCollectionRef.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          docs: mockAgents.map((a) => ({ data: () => a })),
        }),
      });

      const result = await service.getUserAgents('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Agent 1');
    });
  });

  describe('getAgent', () => {
    it('should return existing agent', async () => {
      const mockData = { id: 'a-1', userId: 'user-1', name: 'Test' };
      mockGet.mockResolvedValue({ exists: true, data: () => mockData });

      const result = await service.getAgent('user-1', 'a-1');
      expect(result.name).toBe('Test');
    });

    it('should throw NotFoundException for missing agent', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.getAgent('user-1', 'missing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAgent', () => {
    const existingAgent = {
      id: 'a-1',
      userId: 'user-1',
      name: 'Old Name',
      description: 'Old Desc',
      templateId: 'study-buddy',
      persona: validPersona,
      createdAt: '2026-01-01',
      chatCount: 5,
    };

    it('should update agent with partial data', async () => {
      mockGet.mockResolvedValue({
        exists: true, data: () => existingAgent,
      });

      const result = await service.updateAgent('user-1', 'a-1', {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('Old Desc');
      expect(mockSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when agent does not exist', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.updateAgent('user-1', 'missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAgent', () => {
    it('should delete an existing agent', async () => {
      mockGet.mockResolvedValue({ exists: true });

      await service.deleteAgent('user-1', 'a-1');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing agent', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.deleteAgent('user-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('chatWithAgent', () => {
    const agentData = {
      id: 'a-1',
      userId: 'user-1',
      name: 'Buddy',
      description: 'Test agent',
      templateId: 'study-buddy',
      persona: validPersona,
      createdAt: '2026-01-01',
      chatCount: 3,
    };

    /** Helper: collect all chunks from async generator */
    async function collectChunks(
      gen: AsyncGenerator<AgentChatChunk>,
    ): Promise<AgentChatChunk[]> {
      const chunks: AgentChatChunk[] = [];
      for await (const chunk of gen) {
        chunks.push(chunk);
      }
      return chunks;
    }

    beforeEach(() => {
      mockGet.mockResolvedValue({
        exists: true, data: () => agentData,
      });

      /* Reset moderation mocks to defaults for each chatWithAgent test */
      mockModeration.moderateInput.mockReturnValue({ passed: true, flags: [] });
      mockModeration.moderateOutput.mockReturnValue({ passed: true, flags: [] });

      /* Default AI gateway mock — returns a fresh generator per call */
      mockAiGateway.streamChat.mockImplementation(() =>
        (async function* () {
          yield { type: 'token', content: 'Hello ' };
          yield { type: 'token', content: 'world!' };
        })(),
      );
    });

    it('should stream message_start, tokens, and message_done', async () => {

      const chunks = await collectChunks(
        service.chatWithAgent('user-1', 'a-1', 'Hi', []),
      );

      expect(chunks[0].type).toBe('message_start');
      expect(chunks[1].type).toBe('message_token');
      expect(chunks[2].type).toBe('message_token');
      expect(chunks[3].type).toBe('message_done');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should yield error when input moderation fails', async () => {
      mockModeration.moderateInput.mockReturnValueOnce({
        passed: false, flags: ['harmful'],
      });

      const chunks = await collectChunks(
        service.chatWithAgent('user-1', 'a-1', 'bad message', []),
      );

      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].code).toBe('MODERATION_BLOCKED');
    });

    it('should yield error when history exceeds max', async () => {
      const longHistory = Array.from({ length: 21 }, () => ({
        role: 'user' as const,
        content: 'msg',
      }));

      const chunks = await collectChunks(
        service.chatWithAgent('user-1', 'a-1', 'Hi', longHistory),
      );

      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].code).toBe('HISTORY_TOO_LONG');
    });

    it('should yield error when AI gateway throws', async () => {
      mockAiGateway.streamChat.mockImplementation(() =>
        (async function* () {
          throw new Error('API connection failed');
        })(),
      );

      const chunks = await collectChunks(
        service.chatWithAgent('user-1', 'a-1', 'Hi', []),
      );

      const errorChunk = chunks.find((c) => c.type === 'error');
      expect(errorChunk).toBeDefined();
      expect(errorChunk?.code).toBe('CHAT_ERROR');
    });
  });
});
