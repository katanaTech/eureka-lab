import { Test, TestingModule } from '@nestjs/testing';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { InventoryService } from '../inventory/inventory.service';
import { UiModeResolver } from '../tenants/ui-mode-resolver.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { BattleConfig } from '@eureka-lab/shared-types';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

const mockUser: AuthenticatedUser = {
  uid: 'child-uid-1',
  email: 'kid@example.com',
  role: 'child',
};

const mockBattleConfig: BattleConfig = {
  battleId: 'battle-abc',
  battleType: 'minion',
  zombieType: 'misinformation_mole',
  zombieName: 'Misinformation Mole',
  zombieDialogue: 'Your prompts are WORTHLESS!',
  playerMaxHp: 100,
  zombieMaxHp: 30,
  questions: [],
};

const mockCombatService = {
  initBattle: jest.fn().mockResolvedValue(mockBattleConfig),
  completeBattle: jest.fn().mockResolvedValue({ xpAwarded: 25, badgesUnlocked: [], battleType: 'minion' }),
  generateCertificate: jest.fn().mockResolvedValue({ certificateUrl: 'https://example.com/cert.svg' }),
};

const mockInventoryService = {
  awardKp: jest.fn().mockResolvedValue(15),
};

const mockUiModeResolver = {
  resolve: jest.fn().mockResolvedValue('gamified'),
};

describe('CombatController', () => {
  let controller: CombatController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CombatController],
      providers: [
        { provide: CombatService, useValue: mockCombatService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: UiModeResolver, useValue: mockUiModeResolver },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<CombatController>(CombatController);
  });

  describe('initBattle', () => {
    it('delegates to CombatService and returns battle config', async () => {
      const result = await controller.initBattle(mockUser, {
        battleType: 'minion',
        zoneId: 'library',
      });

      expect(mockCombatService.initBattle).toHaveBeenCalledWith('child-uid-1', {
        battleType: 'minion',
        zoneId: 'library',
      });
      expect(result).toEqual(mockBattleConfig);
    });
  });

  describe('completeBattle', () => {
    it('delegates to CombatService with battleId and returns reward', async () => {
      const result = await controller.completeBattle(mockUser, 'battle-abc', {
        outcome: 'victory',
        correctAnswers: 5,
        totalQuestions: 5,
      });

      expect(mockCombatService.completeBattle).toHaveBeenCalledWith(
        'child-uid-1',
        'battle-abc',
        { outcome: 'victory', correctAnswers: 5, totalQuestions: 5 },
      );
      expect(result.xpAwarded).toBe(25);
      expect(result.kpAwarded).toBe(15);
    });
  });

  describe('generateCertificate', () => {
    it('delegates to CombatService and returns URL', async () => {
      const result = await controller.generateCertificate(mockUser, {
        displayName: 'Ada',
      });

      expect(mockCombatService.generateCertificate).toHaveBeenCalledWith(
        'child-uid-1',
        'Ada',
      );
      expect(result.certificateUrl).toBe('https://example.com/cert.svg');
    });

    it('falls back to "Champion" when displayName is missing', async () => {
      await controller.generateCertificate(mockUser, { displayName: '' });
      expect(mockCombatService.generateCertificate).toHaveBeenCalledWith(
        'child-uid-1',
        'Champion',
      );
    });
  });
});
