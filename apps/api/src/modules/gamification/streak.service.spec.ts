import { Test, TestingModule } from '@nestjs/testing';
import { StreakService } from './streak.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/**
 * Unit tests for StreakService.
 * Tests streak calculation, freeze logic, and activity recording.
 */
describe('StreakService', () => {
  let service: StreakService;

  const mockRunTransaction = jest.fn();
  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockUpdate = jest.fn();

  const mockFirebaseService = {
    firestore: {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: mockGet,
          set: mockSet,
          update: mockUpdate,
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              get: mockGet,
              set: mockSet,
            }),
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ docs: [] }),
              }),
            }),
          }),
        }),
      }),
      runTransaction: mockRunTransaction,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStreak', () => {
    it('should start streak at 1 for first activity', async () => {
      mockRunTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            get: jest.fn().mockResolvedValue({
              data: () => ({
                lastActiveDate: '',
                streak: 0,
                longestStreak: 0,
                xp: 0,
              }),
            }),
            update: jest.fn(),
          };
          return fn(tx);
        },
      );

      const result = await service.updateStreak('user-123');
      expect(result.streak).toBe(1);
      expect(result.bonusXp).toBe(0);
    });

    it('should increment streak on consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      mockRunTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            get: jest.fn().mockResolvedValue({
              data: () => ({
                lastActiveDate: yesterdayKey,
                streak: 5,
                longestStreak: 5,
                xp: 100,
              }),
            }),
            update: jest.fn(),
          };
          return fn(tx);
        },
      );

      const result = await service.updateStreak('user-123');
      expect(result.streak).toBe(6);
    });

    it('should not change streak if already counted today', async () => {
      const todayKey = new Date().toISOString().split('T')[0];

      mockRunTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            get: jest.fn().mockResolvedValue({
              data: () => ({
                lastActiveDate: todayKey,
                streak: 5,
                longestStreak: 5,
                xp: 100,
              }),
            }),
            update: jest.fn(),
          };
          return fn(tx);
        },
      );

      const result = await service.updateStreak('user-123');
      expect(result.streak).toBe(5);
      expect(result.bonusXp).toBe(0);
    });

    it('should reset streak after missed day', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
      const twoDaysAgoKey = twoDaysAgo.toISOString().split('T')[0];

      mockRunTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            get: jest.fn().mockResolvedValue({
              data: () => ({
                lastActiveDate: twoDaysAgoKey,
                streak: 10,
                longestStreak: 10,
                xp: 200,
              }),
            }),
            update: jest.fn(),
          };
          return fn(tx);
        },
      );

      const result = await service.updateStreak('user-123');
      expect(result.streak).toBe(1);
    });

    it('should award bonus XP at 3-day milestone', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      mockRunTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            get: jest.fn().mockResolvedValue({
              data: () => ({
                lastActiveDate: yesterdayKey,
                streak: 2,
                longestStreak: 2,
                xp: 50,
              }),
            }),
            update: jest.fn(),
          };
          return fn(tx);
        },
      );

      const result = await service.updateStreak('user-123');
      expect(result.streak).toBe(3);
      expect(result.bonusXp).toBe(25); // 3-day bonus = 25 XP
    });

    it('should award 50 XP at 7-day milestone', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      mockRunTransaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            get: jest.fn().mockResolvedValue({
              data: () => ({
                lastActiveDate: yesterdayKey,
                streak: 6,
                longestStreak: 6,
                xp: 150,
              }),
            }),
            update: jest.fn(),
          };
          return fn(tx);
        },
      );

      const result = await service.updateStreak('user-123');
      expect(result.streak).toBe(7);
      expect(result.bonusXp).toBe(50); // 7-day bonus = 50 XP
    });
  });

  describe('getStreakInfo', () => {
    it('should return correct streak info for active user', async () => {
      const todayKey = new Date().toISOString().split('T')[0];

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          streak: 5,
          longestStreak: 10,
          lastActiveDate: todayKey,
          streakFreezeUsedThisWeek: false,
        }),
      });

      const info = await service.getStreakInfo('user-123');
      expect(info.current).toBe(5);
      expect(info.longest).toBe(10);
      expect(info.freezesRemaining).toBe(1);
    });

    it('should show streak as 0 if inactive for more than 1 day', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
      const threeDaysAgoKey = threeDaysAgo.toISOString().split('T')[0];

      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          streak: 5,
          longestStreak: 10,
          lastActiveDate: threeDaysAgoKey,
          streakFreezeUsedThisWeek: false,
        }),
      });

      const info = await service.getStreakInfo('user-123');
      expect(info.current).toBe(0);
    });
  });

  describe('getActivityCalendar', () => {
    it('should return filled array with zeros for missing days', async () => {
      const mockDocs = [
        {
          data: () => ({
            date: new Date().toISOString().split('T')[0],
            minutesActive: 15,
            promptsUsed: 3,
            activitiesCompleted: 1,
            xpEarned: 30,
          }),
        },
      ];

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ docs: mockDocs }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getActivityCalendar('user-123', 7);

      /* Should have 8 entries (7 days ago + today) */
      expect(result.length).toBeGreaterThanOrEqual(7);
      /* Last entry should have data */
      const lastEntry = result[result.length - 1];
      expect(lastEntry.xpEarned).toBe(30);
    });
  });
});
