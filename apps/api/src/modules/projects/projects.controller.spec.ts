import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { BadgeService } from '../gamification/badge.service';
import { StreakService } from '../gamification/streak.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Unit tests for ProjectsController.
 * Tests CRUD delegation and SSE streaming with gamification triggers.
 */
describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockProjectsService = {
    createProject: jest.fn(),
    getUserProjects: jest.fn(),
    getProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    generateCode: jest.fn(),
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
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: StreakService, useValue: mockStreakService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  describe('createProject', () => {
    it('should delegate to service and trigger gamification', async () => {
      const projectDoc = { id: 'p-1', name: 'Color Mixer', userId: 'user-1' };
      mockProjectsService.createProject.mockResolvedValue(projectDoc);

      const dto = {
        name: 'Color Mixer',
        description: 'Mix colors',
        templateId: 'color-mixer',
      };

      const result = await controller.createProject(dto, mockUser);

      expect(mockProjectsService.createProject).toHaveBeenCalledWith('user-1', dto);
      expect(result.id).toBe('p-1');
      expect(mockStreakService.recordDailyActivity).toHaveBeenCalled();
      expect(mockBadgeService.checkAndAwardBadges).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: 'project_created' }),
      );
    });
  });

  describe('listProjects', () => {
    it('should return projects wrapped in object', async () => {
      mockProjectsService.getUserProjects.mockResolvedValue([
        { id: 'p-1', name: 'Proj 1' },
      ]);

      const result = await controller.listProjects(mockUser);

      expect(result.projects).toHaveLength(1);
      expect(mockProjectsService.getUserProjects).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getProject', () => {
    it('should delegate to service with user uid and id', async () => {
      mockProjectsService.getProject.mockResolvedValue({ id: 'p-1' });

      const result = await controller.getProject('p-1', mockUser);

      expect(mockProjectsService.getProject).toHaveBeenCalledWith('user-1', 'p-1');
      expect(result.id).toBe('p-1');
    });
  });

  describe('updateProject', () => {
    it('should delegate to service with correct params', async () => {
      mockProjectsService.updateProject.mockResolvedValue({
        id: 'p-1', htmlCode: '<div>new</div>',
      });

      const dto = {
        htmlCode: '<div>new</div>',
        cssCode: 'div {}',
        jsCode: '',
      };

      const result = await controller.updateProject('p-1', dto, mockUser);

      expect(mockProjectsService.updateProject).toHaveBeenCalledWith(
        'user-1', 'p-1', dto,
      );
      expect(result.htmlCode).toBe('<div>new</div>');
    });
  });

  describe('deleteProject', () => {
    it('should delegate deletion to service', async () => {
      mockProjectsService.deleteProject.mockResolvedValue(undefined);

      await controller.deleteProject('p-1', mockUser);

      expect(mockProjectsService.deleteProject).toHaveBeenCalledWith('user-1', 'p-1');
    });
  });

  describe('generateCode', () => {
    it('should stream SSE chunks and trigger gamification on done', async () => {
      const writtenChunks: string[] = [];
      const mockReply = {
        raw: {
          writeHead: jest.fn(),
          write: jest.fn((data: string) => writtenChunks.push(data)),
          end: jest.fn(),
        },
      };

      mockProjectsService.generateCode.mockReturnValue(
        (async function* () {
          yield { type: 'code_start', language: 'html' };
          yield { type: 'code_token', content: '<div>' };
          yield { type: 'code_done', language: 'html', fullCode: '<div>' };
        })(),
      );

      await controller.generateCode(
        'p-1',
        { prompt: 'Add div', targetFile: 'html' },
        mockUser,
        mockReply as never,
      );

      expect(mockReply.raw.writeHead).toHaveBeenCalledWith(
        200,
        expect.objectContaining({ 'Content-Type': 'text/event-stream' }),
      );
      expect(writtenChunks).toHaveLength(3);
      expect(writtenChunks[0]).toContain('code_start');
      expect(mockReply.raw.end).toHaveBeenCalled();
      expect(mockBadgeService.checkAndAwardBadges).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ type: 'code_generated' }),
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

      mockProjectsService.generateCode.mockReturnValue(
        (async function* () {
          throw new Error('API failure');
        })(),
      );

      await controller.generateCode(
        'p-1',
        { prompt: 'Add button', targetFile: 'html' },
        mockUser,
        mockReply as never,
      );

      const errorChunk = writtenChunks.find((c) => c.includes('GENERATION_ERROR'));
      expect(errorChunk).toBeDefined();
      expect(mockReply.raw.end).toHaveBeenCalled();
    });
  });
});
