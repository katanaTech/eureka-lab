import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { Inventory, ShopCatalog } from '@eureka-lab/shared-types';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

// ── Mock guard ────────────────────────────────────────────────────────────────

const mockGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ── Mock user ─────────────────────────────────────────────────────────────────

const mockUser: AuthenticatedUser = {
  uid: 'child-uid-1',
  email: 'kid@example.com',
  role: 'child',
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockInventory: Inventory = {
  kp: 150,
  totalKpEarned: 400,
  ownedAbilityIds: ['ability-spark-bolt'],
  ownedWeaponIds: ['weapon-starter-wand'],
  equippedWeaponId: 'weapon-starter-wand',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockCatalog: ShopCatalog = {
  abilities: [],
  weapons: [],
};

// ── Mock service ──────────────────────────────────────────────────────────────

const mockInventoryService = {
  getInventory: jest.fn().mockResolvedValue(mockInventory),
  getCatalog: jest.fn().mockReturnValue(mockCatalog),
  purchaseItem: jest.fn().mockResolvedValue(mockInventory),
  equipWeapon: jest.fn().mockResolvedValue(mockInventory),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('InventoryController', () => {
  let controller: InventoryController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET /inventory ─────────────────────────────────────────────────────────

  describe('getInventory', () => {
    it('delegates to InventoryService.getInventory with user uid', async () => {
      const result = await controller.getInventory(mockUser);

      expect(mockInventoryService.getInventory).toHaveBeenCalledWith(
        'child-uid-1',
      );
      expect(result).toEqual(mockInventory);
    });
  });

  // ── GET /shop/catalog ─────────────────────────────────────────────────────

  describe('getCatalog', () => {
    it('delegates to InventoryService.getCatalog and returns the catalog', () => {
      const result = controller.getCatalog(mockUser);

      expect(mockInventoryService.getCatalog).toHaveBeenCalled();
      expect(result).toEqual(mockCatalog);
    });
  });

  // ── POST /inventory/buy ───────────────────────────────────────────────────

  describe('purchaseItem', () => {
    it('delegates to InventoryService.purchaseItem with user uid and dto', async () => {
      const dto = { itemId: 'ability-mind-blast', itemType: 'ability' as const };

      const result = await controller.purchaseItem(mockUser, dto);

      expect(mockInventoryService.purchaseItem).toHaveBeenCalledWith(
        'child-uid-1',
        dto,
      );
      expect(result).toEqual(mockInventory);
    });
  });

  // ── POST /inventory/equip ─────────────────────────────────────────────────

  describe('equipWeapon', () => {
    it('delegates to InventoryService.equipWeapon with user uid and dto', async () => {
      const dto = { weaponId: 'weapon-echo-staff' };

      const result = await controller.equipWeapon(mockUser, dto);

      expect(mockInventoryService.equipWeapon).toHaveBeenCalledWith(
        'child-uid-1',
        dto,
      );
      expect(result).toEqual(mockInventory);
    });

    it('delegates with null weaponId to unequip', async () => {
      const dto = { weaponId: null };

      await controller.equipWeapon(mockUser, dto);

      expect(mockInventoryService.equipWeapon).toHaveBeenCalledWith(
        'child-uid-1',
        dto,
      );
    });
  });
});
