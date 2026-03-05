import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { AiGatewayService } from '../ai/ai-gateway.service';
import { ContentModerationService } from '../ai/content-moderation.service';
import type { CodeStreamChunk } from '@eureka-lab/shared-types';

/**
 * Unit tests for ProjectsService.
 * Tests CRUD, code size validation, and SSE code generation streaming.
 */
describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockDelete = jest.fn();

  const mockDocRef = {
    id: 'proj-test-123',
    get: mockGet,
    set: mockSet,
    delete: mockDelete,
  };

  const mockCollectionRef = {
    doc: jest.fn().mockReturnValue(mockDocRef),
    orderBy: jest.fn(),
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

  /** Valid create params using an existing code template */
  const validCreateParams = {
    name: 'My Project',
    description: 'A test project',
    templateId: 'bouncing-ball',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AiGatewayService, useValue: mockAiGateway },
        { provide: ContentModerationService, useValue: mockModeration },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);

    mockSet.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockCollectionRef.orderBy.mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    });
  });

  describe('createProject', () => {
    it('should create a project with valid template', async () => {
      const result = await service.createProject('user-1', validCreateParams);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
      expect(result.name).toBe('My Project');
      expect(result.templateId).toBe('bouncing-ball');
      expect(result.htmlCode).toBeDefined();
      expect(mockSet).toHaveBeenCalled();
    });

    it('should reject unknown templateId', async () => {
      await expect(
        service.createProject('user-1', {
          ...validCreateParams,
          templateId: 'nonexistent',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when name fails moderation', async () => {
      mockModeration.moderateInput
        .mockReturnValueOnce({ passed: false, flags: ['harmful'] });

      await expect(
        service.createProject('user-1', validCreateParams),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when description fails moderation', async () => {
      mockModeration.moderateInput
        .mockReturnValueOnce({ passed: true, flags: [] })
        .mockReturnValueOnce({ passed: false, flags: ['adult'] });

      await expect(
        service.createProject('user-1', validCreateParams),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserProjects', () => {
    it('should return empty array for user with no projects', async () => {
      const result = await service.getUserProjects('user-1');
      expect(result).toEqual([]);
    });

    it('should return array of project documents', async () => {
      const mockProjects = [
        { id: 'p-1', name: 'Project 1' },
        { id: 'p-2', name: 'Project 2' },
      ];
      mockCollectionRef.orderBy.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          docs: mockProjects.map((p) => ({ data: () => p })),
        }),
      });

      const result = await service.getUserProjects('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getProject', () => {
    it('should return existing project', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ id: 'p-1', name: 'Test' }),
      });

      const result = await service.getProject('user-1', 'p-1');
      expect(result.name).toBe('Test');
    });

    it('should throw NotFoundException for missing project', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.getProject('user-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProject', () => {
    const existingProject = {
      id: 'p-1',
      userId: 'user-1',
      name: 'My Project',
      description: 'Desc',
      templateId: 'bouncing-ball',
      htmlCode: '<div>old</div>',
      cssCode: 'div { color: red; }',
      jsCode: 'console.log("old");',
      createdAt: '2026-01-01',
      lastModifiedAt: '2026-01-01',
    };

    it('should update code and lastModifiedAt', async () => {
      mockGet.mockResolvedValue({
        exists: true, data: () => existingProject,
      });

      const result = await service.updateProject('user-1', 'p-1', {
        htmlCode: '<div>new</div>',
        cssCode: 'div { color: blue; }',
        jsCode: 'console.log("new");',
      });

      expect(result.htmlCode).toBe('<div>new</div>');
      expect(result.lastModifiedAt).not.toBe(existingProject.lastModifiedAt);
      expect(mockSet).toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.updateProject('user-1', 'missing', {
          htmlCode: '', cssCode: '', jsCode: '',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject when HTML exceeds max code size', async () => {
      mockGet.mockResolvedValue({
        exists: true, data: () => existingProject,
      });

      const oversizedCode = 'x'.repeat(11 * 1024);

      await expect(
        service.updateProject('user-1', 'p-1', {
          htmlCode: oversizedCode,
          cssCode: '',
          jsCode: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      mockGet.mockResolvedValue({ exists: true });

      await service.deleteProject('user-1', 'p-1');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing project', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.deleteProject('user-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateCode', () => {
    /** Helper: collect all chunks from async generator */
    async function collectChunks(
      gen: AsyncGenerator<CodeStreamChunk>,
    ): Promise<CodeStreamChunk[]> {
      const chunks: CodeStreamChunk[] = [];
      for await (const chunk of gen) {
        chunks.push(chunk);
      }
      return chunks;
    }

    const projectData = {
      id: 'p-1',
      userId: 'user-1',
      name: 'My Project',
      description: 'Desc',
      templateId: 'bouncing-ball',
      htmlCode: '<div></div>',
      cssCode: 'div {}',
      jsCode: '',
      createdAt: '2026-01-01',
      lastModifiedAt: '2026-01-01',
    };

    beforeEach(() => {
      mockGet.mockResolvedValue({
        exists: true, data: () => projectData,
      });

      /* Reset moderation mocks to defaults for each generateCode test */
      mockModeration.moderateInput.mockReturnValue({ passed: true, flags: [] });
      mockModeration.moderateOutput.mockReturnValue({ passed: true, flags: [] });

      /* Default AI gateway mock — returns a fresh generator per call */
      mockAiGateway.streamResponse.mockImplementation(() =>
        (async function* () {
          yield { type: 'token', content: '<div>' };
          yield { type: 'token', content: 'Hello</div>' };
        })(),
      );
    });

    it('should stream code_start, tokens, and code_done', async () => {

      const chunks = await collectChunks(
        service.generateCode('user-1', 'p-1', 'Add text', 'html'),
      );

      expect(chunks[0].type).toBe('code_start');
      expect(chunks[1].type).toBe('code_token');
      expect(chunks[2].type).toBe('code_token');
      expect(chunks[3].type).toBe('code_done');
    });

    it('should yield error when prompt fails moderation', async () => {
      mockModeration.moderateInput.mockReturnValueOnce({
        passed: false, flags: ['harmful'],
      });

      const chunks = await collectChunks(
        service.generateCode('user-1', 'p-1', 'bad prompt', 'html'),
      );

      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].code).toBe('MODERATION_BLOCKED');
    });

    it('should yield error when AI gateway throws', async () => {
      mockAiGateway.streamResponse.mockImplementation(() =>
        (async function* () {
          throw new Error('API timeout');
        })(),
      );

      const chunks = await collectChunks(
        service.generateCode('user-1', 'p-1', 'Add button', 'html'),
      );

      const errorChunk = chunks.find((c) => c.type === 'error');
      expect(errorChunk).toBeDefined();
      expect(errorChunk?.code).toBe('GENERATION_ERROR');
    });

    it('should strip code fences from AI output', async () => {
      mockAiGateway.streamResponse.mockImplementation(() =>
        (async function* () {
          yield { type: 'token', content: '```html\n<div>Hi</div>\n```' };
        })(),
      );

      const chunks = await collectChunks(
        service.generateCode('user-1', 'p-1', 'Add text', 'html'),
      );

      const doneChunk = chunks.find((c) => c.type === 'code_done');
      expect(doneChunk?.fullCode).not.toContain('```');
      expect(doneChunk?.fullCode).toContain('<div>Hi</div>');
    });
  });
});
