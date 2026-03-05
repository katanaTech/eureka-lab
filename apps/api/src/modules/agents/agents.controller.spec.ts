import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Unit tests for AgentsController.
 * Tests CRUD delegation and SSE streaming with gamification triggers.
 */
describe('AgentsController', () => {
  let controller: AgentsController;

  const mockAgentsService = {
    createAgent: jest.fn(),
    getUserAgents: jest.fn(),
    getAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
    chatWithAgent: jest.fn(),
  };

  const mockBadgeService = {
    checkAndAwardBadges: jest.fn().mockResolvedValue([]),
  };

  const mockStreakService = {
    recordDailyActivity: jest.fn().mockResolvedValue(undefined),
    updateStreak: jest.fn().mockResolvedValue(undefined),
  };

  const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

  const mockUser: AuthenticatedUser = {
    uid: 'user-1',
    email: 'user@test.com',
    role: 'child',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        { provide: AgentsService, useValue: mockAgentsService },
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: StreakService, useValue: mockStreakService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<AgentsController>(AgentsController);
  });

  describe('createAgent', () => {
    it('should delegate to service and trigger gamification', async () => {
      const agentDoc = { id: 'a-1', name: 'Buddy', userId: 'user-1' };
      mockAgentsService.createAgent.mockResolvedValue(agentDoc);

      const dto = {
        name: 'Buddy',
        description: 'A test agent',
        templateId: 'study-buddy',
        persona: {
          name: 'Buddy',
          systemPrompt: 'You are friendly.',
          knowledgeBase: 'General',
          goals: [],
          guardrails: [],
        },
      };

      const result = await controller.createAgent(dto, mockUser);

      expect(mockAgentsService.createAgent).toHaveBeenCalledWith('user-1', dto);
      expect(result.id).toBe('a-1');
      expect(mockStreakService.recordDailyActivity).toHaveBeenCalled();
      expect(mockBadgeService.checkAndAwardBadges).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: 'agent_created' }),
      );
    });
  });

  describe('listAgents', () => {
    it('should return agents wrapped in object', async () => {
      mockAgentsService.getUserAgents.mockResolvedValue([
        { id: 'a-1', name: 'Agent 1' },
      ]);

      const result = await controller.listAgents(mockUser);

      expect(result.agents).toHaveLength(1);
      expect(mockAgentsService.getUserAgents).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getAgent', () => {
    it('should delegate to service with user uid and id', async () => {
      mockAgentsService.getAgent.mockResolvedValue({ id: 'a-1' });

      const result = await controller.getAgent('a-1', mockUser);

      expect(mockAgentsService.getAgent).toHaveBeenCalledWith('user-1', 'a-1');
      expect(result.id).toBe('a-1');
    });
  });

  describe('updateAgent', () => {
    it('should delegate to service with correct params', async () => {
      mockAgentsService.updateAgent.mockResolvedValue({ id: 'a-1', name: 'New' });

      const result = await controller.updateAgent(
        'a-1', { name: 'New' }, mockUser,
      );

      expect(mockAgentsService.updateAgent).toHaveBeenCalledWith(
        'user-1', 'a-1', { name: 'New' },
      );
      expect(result.name).toBe('New');
    });
  });

  describe('deleteAgent', () => {
    it('should delegate deletion to service', async () => {
      mockAgentsService.deleteAgent.mockResolvedValue(undefined);

      await controller.deleteAgent('a-1', mockUser);

      expect(mockAgentsService.deleteAgent).toHaveBeenCalledWith('user-1', 'a-1');
    });
  });

  describe('chatWithAgent', () => {
    it('should stream SSE chunks and trigger gamification on done', async () => {
      const writtenChunks: string[] = [];
      const mockReply = {
        raw: {
          writeHead: jest.fn(),
          write: jest.fn((data: string) => writtenChunks.push(data)),
          end: jest.fn(),
        },
      };

      mockAgentsService.chatWithAgent.mockReturnValue(
        (async function* () {
          yield { type: 'message_start' };
          yield { type: 'message_token', content: 'Hi' };
          yield { type: 'message_done', fullMessage: 'Hi' };
        })(),
      );

      await controller.chatWithAgent(
        'a-1',
        { message: 'Hello', history: [] },
        mockUser,
        mockReply as never,
      );

      expect(mockReply.raw.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({ 'Content-Type': 'text/event-stream' }),
      );
      expect(writtenChunks).toHaveLength(3);
      expect(writtenChunks[0]).toContain('message_start');
      expect(mockReply.raw.end).toHaveBeenCalled();
      expect(mockBadgeService.checkAndAwardBadges).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: 'agent_chat' }),
      );
    });

    it('should write error and close stream on exception', async () => {
      const writtenChunks: string[] = [];
      const mockReply = {
        raw: {
          writeHead: jest.fn(),
          write: jest.fn((data: string) => writtenChunks.push(data)),
          end: jest.fn(),
        },
      };

      mockAgentsService.chatWithAgent.mockReturnValue(
        (async function* () {
          throw new Error('Connection lost');
        })(),
      );

      await controller.chatWithAgent(
        'a-1',
        { message: 'Hi', history: [] },
        mockUser,
        mockReply as never,
      );

      const errorChunk = writtenChunks.find((c) => c.includes('CHAT_ERROR'));
      expect(errorChunk).toBeDefined();
      expect(mockReply.raw.end).toHaveBeenCalled();
    });
  });
});
