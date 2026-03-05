import { Test, TestingModule } from '@nestjs/testing';
import { BadgeService } from './badge.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/**
 * Unit tests for BadgeService.
 * Tests badge award logic, idempotency, and condition evaluation.
 */
describe('BadgeService', () => {
  let service: BadgeService;

  /** Mock Firestore document data store */
  const mockStore: Record<string, Record<string, unknown>> = {};

  const mockGet = jest.fn();
  const mockSet = jest.fn();
  const mockOrderBy = jest.fn();
  const mockWhere = jest.fn();
  const mockRunTransaction = jest.fn();

  const mockFirebaseService = {
    firestore: {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              get: mockGet,
              set: mockSet,
            }),
            orderBy: mockOrderBy.mockReturnValue({
              get: jest.fn().mockResolvedValue({ docs: [] }),
            }),
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({ xp: 0, streak: 0 }),
          }),
        }),
        where: mockWhere.mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
      }),
      runTransaction: mockRunTransaction,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<BadgeService>(BadgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty badges for new user', async () => {
    mockOrderBy.mockReturnValue({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    });

    const badges = await service.getUserBadges('user-123');
    expect(badges).toEqual([]);
  });

  it('should award "first-prompt" badge when totalPrompts >= 1', async () => {
    /* Mock: no existing badges */
    const mockBadgesCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: mockSet.mockResolvedValue(undefined),
      }),
      get: jest.fn().mockResolvedValue({ docs: [] }),
      orderBy: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
    };

    /* Mock: user with 1 prompt in stats */
    const mockStatsDoc = {
      exists: true,
      data: () => ({
        totalPrompts: 1,
        bestPromptScore: 0.5,
        promptsWithContext: 0,
        activityTypes: [],
      }),
    };

    const mockUserDoc = {
      exists: true,
      data: () => ({ xp: 10, streak: 0 }),
    };

    mockFirebaseService.firestore.collection = jest.fn((name: string) => {
      if (name === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockUserDoc),
            collection: jest.fn((sub: string) => {
              if (sub === 'badges') return mockBadgesCollection;
              if (sub === 'stats') {
                return {
                  doc: jest.fn().mockReturnValue({
                    get: jest.fn().mockResolvedValue(mockStatsDoc),
                  }),
                };
              }
              return { get: jest.fn().mockResolvedValue({ docs: [] }) };
            }),
          }),
        };
      }
      if (name === 'progress') {
        return {
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
        };
      }
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: false }),
        }),
      };
    });

    const result = await service.checkAndAwardBadges('user-123', {
      type: 'prompt_sent',
    });

    expect(result.newBadges.length).toBeGreaterThanOrEqual(1);
    expect(result.newBadges.some((b) => b.id === 'first-prompt')).toBe(true);
  });

  it('should not duplicate an already-earned badge', async () => {
    /* Mock: "first-prompt" already earned */
    const mockBadgesCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true }),
        set: mockSet,
      }),
      get: jest.fn().mockResolvedValue({
        docs: [{ id: 'first-prompt' }],
      }),
      orderBy: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }),
    };

    const mockStatsDoc = {
      exists: true,
      data: () => ({
        totalPrompts: 5,
        bestPromptScore: 0.5,
        promptsWithContext: 0,
        activityTypes: [],
      }),
    };

    const mockUserDoc = {
      exists: true,
      data: () => ({ xp: 10, streak: 0 }),
    };

    mockFirebaseService.firestore.collection = jest.fn((name: string) => {
      if (name === 'users') {
        return {
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockUserDoc),
            collection: jest.fn((sub: string) => {
              if (sub === 'badges') return mockBadgesCollection;
              if (sub === 'stats') {
                return {
                  doc: jest.fn().mockReturnValue({
                    get: jest.fn().mockResolvedValue(mockStatsDoc),
                  }),
                };
              }
              return { get: jest.fn().mockResolvedValue({ docs: [] }) };
            }),
          }),
        };
      }
      if (name === 'progress') {
        return {
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
        };
      }
      return {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ exists: false }),
        }),
      };
    });

    const result = await service.checkAndAwardBadges('user-123', {
      type: 'prompt_sent',
    });

    /* "first-prompt" should NOT be in newBadges since it's already earned */
    expect(result.newBadges.some((b) => b.id === 'first-prompt')).toBe(false);
  });

  it('should record prompt stats atomically', async () => {
    const mockStatsRef = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockRunTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            totalPrompts: 5,
            bestPromptScore: 0.7,
            promptsWithContext: 2,
            activityTypes: ['lesson'],
          }),
        }),
        set: jest.fn(),
      };
      await fn(tx);
      expect(tx.set).toHaveBeenCalled();
      const setArgs = tx.set.mock.calls[0][1];
      expect(setArgs.totalPrompts).toBe(6);
      expect(setArgs.bestPromptScore).toBe(0.9);
      expect(setArgs.promptsWithContext).toBe(3);
      expect(setArgs.activityTypes).toContain('prompt_exercise');
    });

    mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(mockStatsRef),
        }),
      }),
    });

    await service.recordPromptStats('user-123', {
      promptScore: 0.9,
      hasContext: true,
      activityType: 'prompt_exercise',
    });

    expect(mockRunTransaction).toHaveBeenCalled();
  });
});
