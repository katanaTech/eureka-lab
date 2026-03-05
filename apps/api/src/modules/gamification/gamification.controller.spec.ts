import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller';
import { BadgeService } from './badge.service';
import { StreakService } from './streak.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Unit tests for GamificationController.
 * Tests profile aggregation, badges, activity, streak freeze, and leaderboard.
 */
describe('GamificationController', () => {
  let controller: GamificationController;

  const mockUserDocGet = jest.fn();
  const mockOrderBy = jest.fn();

  const mockFirebaseService = {
    firestore: {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({ get: mockUserDocGet }),
        orderBy: mockOrderBy,
      }),
    },
  };

  const mockBadgeService = {
    getUserBadges: jest.fn(),
  };

  const mockStreakService = {
    getStreakInfo: jest.fn(),
    getActivityCalendar: jest.fn(),
    useStreakFreeze: jest.fn(),
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
      controllers: [GamificationController],
      providers: [
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: StreakService, useValue: mockStreakService },
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<GamificationController>(GamificationController);

    /* Default mock responses */
    mockUserDocGet.mockResolvedValue({
      data: () => ({ xp: 250, streak: 5 }),
    });
    mockBadgeService.getUserBadges.mockResolvedValue([
      { id: 'first-prompt', name: 'First Prompt' },
    ]);
    mockStreakService.getStreakInfo.mockResolvedValue({
      current: 5, longest: 10,
    });
    mockStreakService.getActivityCalendar.mockResolvedValue([
      { date: '2026-02-01', xp: 50 },
    ]);
    mockStreakService.useStreakFreeze.mockResolvedValue(undefined);
  });

  describe('getProfile', () => {
    it('should return full gamification profile', async () => {
      const result = await controller.getProfile(mockUser);

      expect(result.xp).toBe(250);
      expect(result.level).toBeDefined();
      expect(result.streak).toEqual({ current: 5, longest: 10 });
      expect(result.badges).toHaveLength(1);
      expect(result.recentActivity).toHaveLength(1);
    });

    it('should handle missing user doc gracefully', async () => {
      mockUserDocGet.mockResolvedValue({ data: () => undefined });

      const result = await controller.getProfile(mockUser);

      expect(result.xp).toBe(0);
    });
  });

  describe('getBadges', () => {
    it('should delegate to badgeService', async () => {
      const result = await controller.getBadges(mockUser);

      expect(mockBadgeService.getUserBadges).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getActivity', () => {
    it('should use default days=30 when not provided', async () => {
      await controller.getActivity(mockUser, {});

      expect(mockStreakService.getActivityCalendar).toHaveBeenCalledWith(
        'user-1', 30,
      );
    });

    it('should use custom days value when provided', async () => {
      await controller.getActivity(mockUser, { days: 7 });

      expect(mockStreakService.getActivityCalendar).toHaveBeenCalledWith(
        'user-1', 7,
      );
    });
  });

  describe('useStreakFreeze', () => {
    it('should delegate to streakService and return message', async () => {
      const result = await controller.useStreakFreeze(mockUser);

      expect(mockStreakService.useStreakFreeze).toHaveBeenCalledWith('user-1');
      expect(result.message).toContain('Streak freeze');
    });
  });

  describe('getLeaderboard', () => {
    beforeEach(() => {
      mockOrderBy.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [
              { data: () => ({ displayName: 'John Doe', xp: 500, streak: 10 }) },
              { data: () => ({ displayName: 'Alice', xp: 400, streak: 7 }) },
              { data: () => ({ displayName: 'Bob Smith', xp: 300, streak: 5 }) },
            ],
          }),
        }),
      });
    });

    it('should return anonymized leaderboard entries with ranks', async () => {
      const result = await controller.getLeaderboard({});

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[0].displayName).toBe('John D.');
      expect(result[0].xp).toBe(500);
      expect(result[1].rank).toBe(2);
      expect(result[1].displayName).toBe('Alice');
    });

    it('should anonymize multi-word names as first + initial', async () => {
      const result = await controller.getLeaderboard({});

      expect(result[0].displayName).toBe('John D.');
      expect(result[2].displayName).toBe('Bob S.');
    });

    it('should keep single-word names as-is', async () => {
      const result = await controller.getLeaderboard({});

      expect(result[1].displayName).toBe('Alice');
    });
  });
});
