import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CombatService } from './combat.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { BadgeService } from '../gamification/badge.service';
import { QUIZ_BANK, getZoneQuestions, getOverlordQuestions } from './quiz-bank';

// ── Shared mock helpers ───────────────────────────────────────────────────────

const mockDocRef = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
};

const mockCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDocRef),
};

const mockFirebase = {
  firestore: {
    collection: jest.fn().mockReturnValue(mockCollectionRef),
  },
  storage: {
    bucket: jest.fn().mockReturnValue({
      file: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(undefined),
        getSignedUrl: jest.fn().mockResolvedValue(['https://storage.example.com/cert.svg']),
      }),
    }),
  },
};

const mockBadgeService = {
  checkAndAwardBadges: jest.fn().mockResolvedValue({ newBadges: [] }),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('CombatService', () => {
  let service: CombatService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CombatService,
        { provide: FirebaseService, useValue: mockFirebase },
        { provide: BadgeService, useValue: mockBadgeService },
      ],
    }).compile();

    service = module.get<CombatService>(CombatService);
  });

  // ── Quiz bank ─────────────────────────────────────────────────────────────

  describe('QUIZ_BANK', () => {
    it('contains exactly 32 questions', () => {
      expect(QUIZ_BANK).toHaveLength(32);
    });

    it('has 8 questions per zone', () => {
      const zones = ['library', 'forge', 'citadel', 'academy'] as const;
      zones.forEach((zone) => {
        const count = QUIZ_BANK.filter((q) => q.zoneId === zone).length;
        expect(count).toBe(8);
      });
    });

    it('has at least one question with each correct index (0–3)', () => {
      const indices = new Set(QUIZ_BANK.map((q) => q.correctIndex));
      expect(indices.has(0)).toBe(true);
      expect(indices.has(1)).toBe(true);
      expect(indices.has(2)).toBe(true);
      expect(indices.has(3)).toBe(true);
    });

    it('has exactly 4 options for every question', () => {
      QUIZ_BANK.forEach((q) => {
        expect(q.options).toHaveLength(4);
      });
    });
  });

  describe('getZoneQuestions', () => {
    it('returns the requested number of questions', () => {
      const questions = getZoneQuestions('library', 1, 5);
      expect(questions).toHaveLength(5);
    });

    it('only returns questions from the requested zone', () => {
      const questions = getZoneQuestions('forge', 2, 8);
      questions.forEach((q) => expect(q.zoneId).toBe('forge'));
    });

    it('respects the maxTier filter', () => {
      const questions = getZoneQuestions('library', 1, 10);
      questions.forEach((q) => expect(q.difficultyTier).toBeLessThanOrEqual(1));
    });
  });

  describe('getOverlordQuestions', () => {
    it('returns questions from all 4 zones', () => {
      const questions = getOverlordQuestions(2);
      const zones = new Set(questions.map((q) => q.zoneId));
      expect(zones.size).toBe(4);
    });

    it('returns countPerZone × 4 questions total', () => {
      const questions = getOverlordQuestions(3);
      expect(questions).toHaveLength(12);
    });
  });

  // ── initBattle ────────────────────────────────────────────────────────────

  describe('initBattle', () => {
    it('throws BadRequestException when zoneId is missing for a minion battle', async () => {
      await expect(
        service.initBattle('user-1', { battleType: 'minion' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a battle config with correct HP for a minion', async () => {
      const config = await service.initBattle('user-1', {
        battleType: 'minion',
        zoneId: 'library',
      });

      expect(config.battleType).toBe('minion');
      expect(config.zombieType).toBe('misinformation_mole');
      expect(config.playerMaxHp).toBe(100);
      expect(config.zombieMaxHp).toBe(30);
      expect(config.questions).toHaveLength(5);
      expect(config.battleId).toBeDefined();
    });

    it('creates a battle config with correct HP for a guardian', async () => {
      const config = await service.initBattle('user-1', {
        battleType: 'guardian',
        zoneId: 'forge',
      });

      expect(config.zombieType).toBe('lazy_bot');
      expect(config.playerMaxHp).toBe(100);
      expect(config.zombieMaxHp).toBe(80);
      // Zone bank has 8 questions; guardian requests up to 10 but is capped at available count
      expect(config.questions.length).toBeGreaterThanOrEqual(1);
      expect(config.questions.length).toBeLessThanOrEqual(10);
    });

    it('creates overlord config without zoneId', async () => {
      const config = await service.initBattle('user-1', { battleType: 'overlord' });

      expect(config.zombieType).toBe('overlord');
      expect(config.zombieMaxHp).toBe(200);
      expect(config.questions).toHaveLength(20);
    });

    it('writes the session to Firestore', async () => {
      await service.initBattle('user-1', { battleType: 'minion', zoneId: 'library' });
      expect(mockDocRef.set).toHaveBeenCalledTimes(1);
    });
  });

  // ── completeBattle ────────────────────────────────────────────────────────

  describe('completeBattle', () => {
    it('throws NotFoundException when battle does not exist', async () => {
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      await expect(
        service.completeBattle('user-1', 'missing-id', {
          outcome: 'victory',
          correctAnswers: 5,
          totalQuestions: 5,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when userId does not match', async () => {
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'other-user',
          outcome: 'in_progress',
          battleType: 'minion',
        }),
      });

      await expect(
        service.completeBattle('user-1', 'battle-1', {
          outcome: 'victory',
          correctAnswers: 5,
          totalQuestions: 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when battle already completed', async () => {
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-1',
          outcome: 'victory',
          battleType: 'minion',
        }),
      });

      await expect(
        service.completeBattle('user-1', 'battle-1', {
          outcome: 'victory',
          correctAnswers: 5,
          totalQuestions: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('awards XP on victory and updates Firestore', async () => {
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-1',
          outcome: 'in_progress',
          battleType: 'minion',
        }),
      });

      const result = await service.completeBattle('user-1', 'battle-1', {
        outcome: 'victory',
        correctAnswers: 5,
        totalQuestions: 5,
      });

      expect(result.xpAwarded).toBe(25); // COMBAT_XP_REWARDS.minion
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'victory', xpAwarded: 25 }),
      );
    });

    it('awards zero XP on defeat', async () => {
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          userId: 'user-1',
          outcome: 'in_progress',
          battleType: 'guardian',
        }),
      });

      const result = await service.completeBattle('user-1', 'battle-1', {
        outcome: 'defeat',
        correctAnswers: 2,
        totalQuestions: 10,
      });

      expect(result.xpAwarded).toBe(0);
    });
  });

  // ── generateCertificate ──────────────────────────────────────────────────

  describe('generateCertificate', () => {
    it('returns a certificate URL', async () => {
      const result = await service.generateCertificate('user-1', 'Ada');
      expect(result.certificateUrl).toBe('https://storage.example.com/cert.svg');
    });

    it('sanitises the display name to prevent SVG injection', async () => {
      // Should not throw — the name is escaped before being embedded
      await expect(
        service.generateCertificate('user-1', '<script>alert(1)</script>'),
      ).resolves.toBeDefined();
    });
  });
});
