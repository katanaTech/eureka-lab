import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import { ContentModerationService } from '../ai/content-moderation.service';

/**
 * Unit tests for WorkflowsService.
 * Tests CRUD operations, step validation, and execution flow.
 */
describe('WorkflowsService', () => {
  let service: WorkflowsService;

  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockOrderBy = jest.fn();
  const mockWhere = jest.fn();

  const mockDocRef = {
    id: 'wf-test-123',
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
  };

  const mockCollectionRef = {
    doc: jest.fn().mockReturnValue(mockDocRef),
    orderBy: mockOrderBy,
    where: mockWhere,
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
    streamResponse: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AiGatewayService, useValue: mockAiGateway },
        { provide: ContentModerationService, useValue: mockModeration },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);

    /* Reset mocks to reasonable defaults */
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockOrderBy.mockReturnValue({ get: jest.fn().mockResolvedValue({ docs: [] }) });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
    });
  });

  describe('createWorkflow', () => {
    it('should create a workflow with valid data', async () => {
      const result = await service.createWorkflow('user-1', {
        name: 'My Workflow',
        description: 'A test workflow',
        templateId: 'homework-helper',
        steps: [
          {
            id: 'step-1',
            prompt: 'Summarize: {userInput}',
            description: 'Summarize the text',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.name).toBe('My Workflow');
      expect(result.templateId).toBe('homework-helper');
      expect(result.steps).toHaveLength(1);
      expect(result.runCount).toBe(0);
      expect(mockSet).toHaveBeenCalled();
    });

    it('should reject workflows with no steps', async () => {
      await expect(
        service.createWorkflow('user-1', {
          name: 'Empty',
          description: 'No steps',
          templateId: 'homework-helper',
          steps: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject workflows exceeding max steps', async () => {
      const manySteps = Array.from({ length: 6 }, (_, i) => ({
        id: `step-${i + 1}`,
        prompt: `Step ${i + 1}`,
        description: `Step ${i + 1}`,
      }));

      await expect(
        service.createWorkflow('user-1', {
          name: 'Too many',
          description: 'Too many steps',
          templateId: 'test',
          steps: manySteps,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject workflows with invalid step chaining', async () => {
      await expect(
        service.createWorkflow('user-1', {
          name: 'Bad chain',
          description: 'Invalid chaining',
          templateId: 'test',
          steps: [
            {
              id: 'step-1',
              prompt: 'First step',
              inputFrom: 'step-2',
              description: 'References a later step',
            },
            {
              id: 'step-2',
              prompt: 'Second step',
              description: 'Normal step',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject workflows with moderation-flagged name', async () => {
      mockModeration.moderateInput
        .mockReturnValueOnce({ passed: false, flags: ['harmful'] });

      await expect(
        service.createWorkflow('user-1', {
          name: 'Bad Name',
          description: 'Test',
          templateId: 'test',
          steps: [
            { id: 'step-1', prompt: 'Test', description: 'Test' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getWorkflow', () => {
    it('should return a workflow that exists', async () => {
      const mockData = {
        id: 'wf-1',
        userId: 'user-1',
        name: 'Test',
        description: 'Test',
        templateId: 'homework-helper',
        steps: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        runCount: 3,
      };
      mockGet.mockResolvedValue({ exists: true, data: () => mockData });

      const result = await service.getWorkflow('user-1', 'wf-1');
      expect(result.name).toBe('Test');
      expect(result.runCount).toBe(3);
    });

    it('should throw NotFoundException for missing workflow', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.getWorkflow('user-1', 'missing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete an existing workflow', async () => {
      mockGet.mockResolvedValue({ exists: true });

      await service.deleteWorkflow('user-1', 'wf-1');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing workflow', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.deleteWorkflow('user-1', 'missing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('step chaining validation', () => {
    it('should allow valid forward references', async () => {
      const result = await service.createWorkflow('user-1', {
        name: 'Valid chain',
        description: 'Proper chaining',
        templateId: 'test',
        steps: [
          { id: 'step-1', prompt: 'First', description: 'First step' },
          {
            id: 'step-2',
            prompt: 'Uses {step-1}',
            inputFrom: 'step-1',
            description: 'Uses step 1',
          },
          {
            id: 'step-3',
            prompt: 'Uses {step-2}',
            inputFrom: 'step-2',
            description: 'Uses step 2',
          },
        ],
      });

      expect(result.steps).toHaveLength(3);
    });
  });
});
