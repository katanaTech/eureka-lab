import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { SHOP_CATALOG } from './shop-catalog';
import { DAILY_KP_CAP, KP_REWARDS } from './kp-rewards';
import type { Inventory } from '@eureka-lab/shared-types';

// ── Mock helpers ──────────────────────────────────────────────────────────────

/** Creates a fresh Inventory object for test assertions. */
function buildMockInventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    kp: 200,
    totalKpEarned: 500,
    ownedAbilityIds: ['ability-spark-bolt'],
    ownedWeaponIds: ['weapon-starter-wand'],
    equippedWeaponId: 'weapon-starter-wand',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Transaction callback helper: runs the cb with a mock transaction object. */
type TxnCallback = (txn: {
  get: jest.Mock;
  set: jest.Mock;
  update: jest.Mock;
}) => Promise<unknown>;

const mockDocRef = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
};

const mockDailyDocRef = {
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
};

/** Tracks which .doc() call we're on so we can return the right ref. */
let docCallCount = 0;

const mockCollectionRef = {
  doc: jest.fn().mockImplementation(() => {
    docCallCount += 1;
    return mockDocRef;
  }),
  collection: jest.fn().mockReturnThis(),
};

const mockDailyCollectionRef = {
  doc: jest.fn().mockReturnValue(mockDailyDocRef),
};

const mockFirestore = {
  collection: jest.fn().mockImplementation((name: string) => {
    if (name === 'inventories') {
      return {
        doc: jest.fn().mockImplementation(() => ({
          ...mockDocRef,
          collection: jest.fn().mockReturnValue(mockDailyCollectionRef),
        })),
      };
    }
    return mockCollectionRef;
  }),
  runTransaction: jest.fn(),
};

const mockFirebaseService = {
  firestore: mockFirestore,
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    docCallCount = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  // ── SHOP_CATALOG correctness ──────────────────────────────────────────────

  describe('SHOP_CATALOG', () => {
    it('contains exactly 5 abilities', () => {
      expect(SHOP_CATALOG.abilities).toHaveLength(5);
    });

    it('contains exactly 4 weapons', () => {
      expect(SHOP_CATALOG.weapons).toHaveLength(4);
    });

    it('includes a free starter ability (ability-spark-bolt)', () => {
      const starter = SHOP_CATALOG.abilities.find(
        (a) => a.id === 'ability-spark-bolt',
      );
      expect(starter).toBeDefined();
      expect(starter?.cost).toBe(0);
    });

    it('includes a free starter weapon (weapon-starter-wand)', () => {
      const wand = SHOP_CATALOG.weapons.find(
        (w) => w.id === 'weapon-starter-wand',
      );
      expect(wand).toBeDefined();
      expect(wand?.cost).toBe(0);
    });

    it('all ability ids are unique', () => {
      const ids = SHOP_CATALOG.abilities.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all weapon ids are unique', () => {
      const ids = SHOP_CATALOG.weapons.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ── KP_REWARDS constants ──────────────────────────────────────────────────

  describe('KP_REWARDS', () => {
    it('defines a reward for lesson_completed', () => {
      expect(KP_REWARDS.lesson_completed).toBeGreaterThan(0);
    });

    it('defines a reward for minion_defeated', () => {
      expect(KP_REWARDS.minion_defeated).toBeGreaterThan(0);
    });

    it('guardian_defeated rewards more KP than minion_defeated', () => {
      expect(KP_REWARDS.guardian_defeated).toBeGreaterThan(
        KP_REWARDS.minion_defeated,
      );
    });

    it('overlord_defeated rewards the most KP', () => {
      const allRewards = Object.values(KP_REWARDS);
      expect(KP_REWARDS.overlord_defeated).toBe(Math.max(...allRewards));
    });

    it('DAILY_KP_CAP is a positive integer', () => {
      expect(DAILY_KP_CAP).toBeGreaterThan(0);
      expect(Number.isInteger(DAILY_KP_CAP)).toBe(true);
    });
  });

  // ── getInventory ──────────────────────────────────────────────────────────

  describe('getInventory', () => {
    it('returns an existing inventory from Firestore', async () => {
      const mockInventory = buildMockInventory();

      const mockRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockInventory,
        }),
        set: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn(),
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValue(mockRef),
      });

      const result = await service.getInventory('user-1');
      expect(result).toEqual(mockInventory);
      expect(mockRef.set).not.toHaveBeenCalled();
    });

    it('lazily creates a default inventory when none exists', async () => {
      const mockRef = {
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn(),
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValue(mockRef),
      });

      const result = await service.getInventory('new-user');

      expect(mockRef.set).toHaveBeenCalledTimes(1);
      expect(result.kp).toBe(0);
      expect(result.ownedAbilityIds).toContain('ability-spark-bolt');
      expect(result.ownedWeaponIds).toContain('weapon-starter-wand');
      expect(result.equippedWeaponId).toBe('weapon-starter-wand');
    });
  });

  // ── getCatalog ────────────────────────────────────────────────────────────

  describe('getCatalog', () => {
    it('returns the full SHOP_CATALOG', () => {
      const catalog = service.getCatalog();
      expect(catalog).toBe(SHOP_CATALOG);
      expect(catalog.abilities).toHaveLength(5);
      expect(catalog.weapons).toHaveLength(4);
    });
  });

  // ── purchaseItem ──────────────────────────────────────────────────────────

  describe('purchaseItem', () => {
    /** Sets up the runTransaction mock to run the callback immediately. */
    function setupTransaction(inventorySnap: {
      exists: boolean;
      data?: () => Inventory;
    }): void {
      mockFirestore.runTransaction.mockImplementationOnce(
        async (cb: TxnCallback) => {
          const txn = {
            get: jest.fn().mockResolvedValue(inventorySnap),
            set: jest.fn(),
            update: jest.fn(),
          };
          return cb(txn);
        },
      );
    }

    it('successfully purchases an ability and debits KP', async () => {
      const inventory = buildMockInventory({ kp: 100 });
      setupTransaction({ exists: true, data: () => inventory });

      const result = await service.purchaseItem('user-1', {
        itemId: 'ability-mind-blast',
        itemType: 'ability',
      });

      // ability-mind-blast costs 60 KP
      expect(result.kp).toBe(100 - 60);
      expect(result.ownedAbilityIds).toContain('ability-mind-blast');
    });

    it('successfully purchases a weapon and debits KP', async () => {
      const inventory = buildMockInventory({ kp: 200 });
      setupTransaction({ exists: true, data: () => inventory });

      const result = await service.purchaseItem('user-1', {
        itemId: 'weapon-echo-staff',
        itemType: 'weapon',
      });

      // weapon-echo-staff costs 150 KP
      expect(result.kp).toBe(200 - 150);
      expect(result.ownedWeaponIds).toContain('weapon-echo-staff');
    });

    it('throws NotFoundException for an unknown item id', async () => {
      await expect(
        service.purchaseItem('user-1', {
          itemId: 'ability-does-not-exist',
          itemType: 'ability',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when item is already owned', async () => {
      const inventory = buildMockInventory({
        kp: 200,
        ownedAbilityIds: ['ability-spark-bolt', 'ability-mind-blast'],
      });
      setupTransaction({ exists: true, data: () => inventory });

      await expect(
        service.purchaseItem('user-1', {
          itemId: 'ability-mind-blast',
          itemType: 'ability',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when KP is insufficient', async () => {
      const inventory = buildMockInventory({ kp: 10 }); // ability-mind-blast costs 60
      setupTransaction({ exists: true, data: () => inventory });

      await expect(
        service.purchaseItem('user-1', {
          itemId: 'ability-mind-blast',
          itemType: 'ability',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a default inventory when none exists during purchase', async () => {
      // Default inventory has 0 KP, so buying anything with cost > 0 should fail
      setupTransaction({ exists: false });

      await expect(
        service.purchaseItem('user-1', {
          itemId: 'ability-mind-blast',
          itemType: 'ability',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── equipWeapon ───────────────────────────────────────────────────────────

  describe('equipWeapon', () => {
    it('equips an owned weapon successfully', async () => {
      const inventory = buildMockInventory({
        ownedWeaponIds: ['weapon-starter-wand', 'weapon-echo-staff'],
        equippedWeaponId: 'weapon-starter-wand',
      });

      const mockRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => inventory,
        }),
        set: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValue(mockRef),
      });

      const result = await service.equipWeapon('user-1', {
        weaponId: 'weapon-echo-staff',
      });

      expect(result.equippedWeaponId).toBe('weapon-echo-staff');
      expect(mockRef.set).toHaveBeenCalledWith(
        expect.objectContaining({ equippedWeaponId: 'weapon-echo-staff' }),
      );
    });

    it('unequips a weapon when weaponId is null', async () => {
      const inventory = buildMockInventory({
        equippedWeaponId: 'weapon-starter-wand',
      });

      const mockRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => inventory,
        }),
        set: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValue(mockRef),
      });

      const result = await service.equipWeapon('user-1', { weaponId: null });

      expect(result.equippedWeaponId).toBeNull();
    });

    it('throws BadRequestException when equipping an unowned weapon', async () => {
      const inventory = buildMockInventory({
        ownedWeaponIds: ['weapon-starter-wand'],
      });

      const mockRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => inventory,
        }),
        set: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValue(mockRef),
      });

      await expect(
        service.equipWeapon('user-1', { weaponId: 'weapon-void-scepter' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── awardKp ───────────────────────────────────────────────────────────────

  describe('awardKp', () => {
    /**
     * Sets up BOTH runTransaction calls that happen inside awardKp:
     *   1st call: checkAndIncrementDailyCap (returns grantable amount)
     *   2nd call: KP increment on inventory
     */
    function setupAwardKpTransactions(
      earnedToday: number,
      inventorySnap: { exists: boolean; data?: () => Inventory },
    ): void {
      // 1st transaction: daily cap check
      mockFirestore.runTransaction.mockImplementationOnce(
        async (cb: TxnCallback) => {
          const txn = {
            get: jest.fn().mockResolvedValue({
              exists: earnedToday > 0,
              data: () => ({ earnedToday }),
            }),
            set: jest.fn(),
            update: jest.fn(),
          };
          return cb(txn);
        },
      );
      // 2nd transaction: inventory KP update
      mockFirestore.runTransaction.mockImplementationOnce(
        async (cb: TxnCallback) => {
          const txn = {
            get: jest.fn().mockResolvedValue(inventorySnap),
            set: jest.fn(),
            update: jest.fn(),
          };
          return cb(txn);
        },
      );
    }

    it('awards KP for a lesson_completed event', async () => {
      const inventory = buildMockInventory({ kp: 50, totalKpEarned: 100 });
      setupAwardKpTransactions(0, { exists: true, data: () => inventory });

      const awarded = await service.awardKp('user-1', 'lesson_completed');

      expect(awarded).toBe(KP_REWARDS.lesson_completed);
    });

    it('respects the daily KP cap — only grants remaining headroom', async () => {
      // Cap is 100; user has already earned 90 today; event is worth 15
      const earnedToday = 90;
      const inventory = buildMockInventory({ kp: 0, totalKpEarned: 90 });
      setupAwardKpTransactions(earnedToday, {
        exists: true,
        data: () => inventory,
      });

      const awarded = await service.awardKp(
        'user-1',
        'minion_defeated', // worth 15 KP
      );

      // Only 10 KP of headroom remains before the 100-cap
      expect(awarded).toBe(DAILY_KP_CAP - earnedToday);
    });

    it('returns 0 when daily cap is already fully reached', async () => {
      // All 100 KP used up today
      mockFirestore.runTransaction.mockImplementationOnce(
        async (cb: TxnCallback) => {
          const txn = {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ earnedToday: DAILY_KP_CAP }),
            }),
            set: jest.fn(),
            update: jest.fn(),
          };
          return cb(txn);
        },
      );

      const awarded = await service.awardKp('user-1', 'guardian_defeated');

      expect(awarded).toBe(0);
      // 2nd transaction (inventory update) should NOT be called
      expect(mockFirestore.runTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
