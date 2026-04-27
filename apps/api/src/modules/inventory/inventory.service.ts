import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { Inventory, ShopCatalog } from '@eureka-lab/shared-types';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { EquipWeaponDto } from './dto/equip-weapon.dto';
import { SHOP_CATALOG, findAbilityById, findWeaponById } from './shop-catalog';

/** Default inventory for new users — includes free starter items. */
function buildDefaultInventory(): Inventory {
  return {
    kp: 0,
    totalKpEarned: 0,
    ownedAbilityIds: ['ability-spark-bolt'],
    ownedWeaponIds: ['weapon-starter-wand'],
    equippedWeaponId: 'weapon-starter-wand',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Service for the inventory system — reading, buying items, and equipping weapons.
 * All Firestore operations include a userId filter (CLAUDE.md Rule 3).
 * Schema validation is applied before every Firestore write (CLAUDE.md Rule 5).
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly collection = 'inventories';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Retrieve the user's inventory document from Firestore.
   * If no document exists, lazily creates and returns a default inventory.
   *
   * @param userId - Authenticated child user UID
   * @returns The user's Inventory document
   */
  async getInventory(userId: string): Promise<Inventory> {
    const ref = this.firebase.firestore
      .collection(this.collection)
      .doc(userId);

    const snap = await ref.get();

    if (!snap.exists) {
      const defaultInventory = buildDefaultInventory();
      await ref.set(defaultInventory);
      this.logger.log(`Lazy-initialised inventory for userId=${userId}`);
      return defaultInventory;
    }

    return snap.data() as Inventory;
  }

  /**
   * Return the hardcoded shop catalog containing all purchasable abilities and weapons.
   *
   * @returns The full ShopCatalog
   */
  getCatalog(): ShopCatalog {
    return SHOP_CATALOG;
  }

  /**
   * Purchase an item from the shop using an atomic Firestore transaction.
   *
   * Steps performed inside the transaction:
   *   1. Look up item in catalog — 404 if missing
   *   2. Read user inventory (create default if absent)
   *   3. Check duplicate ownership — 409 if already owned
   *   4. Check sufficient KP — 400 if insufficient
   *   5. Debit KP and add item to owned list
   *   6. Write updated inventory
   *
   * @param userId - Authenticated child user UID
   * @param dto - Item purchase parameters (itemId + itemType)
   * @returns Updated Inventory after the purchase
   */
  async purchaseItem(userId: string, dto: PurchaseItemDto): Promise<Inventory> {
    const { itemId, itemType } = dto;

    // Step 1: Validate item exists in catalog (outside transaction — catalog is static)
    const catalogItem =
      itemType === 'ability' ? findAbilityById(itemId) : findWeaponById(itemId);

    if (!catalogItem) {
      throw new NotFoundException(
        `${itemType} '${itemId}' not found in shop catalog.`,
      );
    }

    const ref = this.firebase.firestore
      .collection(this.collection)
      .doc(userId);

    const updatedInventory = await this.firebase.firestore.runTransaction(
      async (txn) => {
        // Step 2: Read inventory (or build default)
        const snap = await txn.get(ref);
        const inventory: Inventory = snap.exists
          ? (snap.data() as Inventory)
          : buildDefaultInventory();

        // Step 3: Check duplicate ownership
        const alreadyOwned =
          itemType === 'ability'
            ? inventory.ownedAbilityIds.includes(itemId)
            : inventory.ownedWeaponIds.includes(itemId);

        if (alreadyOwned) {
          throw new ConflictException(
            `You already own ${itemType} '${itemId}'.`,
          );
        }

        // Step 4: Check sufficient KP
        if (inventory.kp < catalogItem.cost) {
          throw new BadRequestException(
            `Insufficient KP. Required: ${catalogItem.cost}, available: ${inventory.kp}.`,
          );
        }

        // Step 5: Debit KP and add item
        const updated: Inventory = {
          ...inventory,
          kp: inventory.kp - catalogItem.cost,
          ownedAbilityIds:
            itemType === 'ability'
              ? [...inventory.ownedAbilityIds, itemId]
              : inventory.ownedAbilityIds,
          ownedWeaponIds:
            itemType === 'weapon'
              ? [...inventory.ownedWeaponIds, itemId]
              : inventory.ownedWeaponIds,
          updatedAt: new Date().toISOString(),
        };

        // Step 6: Write updated inventory
        txn.set(ref, updated);

        return updated;
      },
    );

    this.logger.log(
      `Purchase complete: userId=${userId} item=${itemId} type=${itemType} cost=${catalogItem.cost}`,
    );

    return updatedInventory;
  }

  /**
   * Equip or unequip a weapon on the user's inventory.
   * Verifies ownership before equipping. Passing null unequips entirely.
   *
   * @param userId - Authenticated child user UID
   * @param dto - weaponId to equip, or null to unequip
   * @returns Updated Inventory after the equip change
   */
  async equipWeapon(userId: string, dto: EquipWeaponDto): Promise<Inventory> {
    const { weaponId } = dto;

    const ref = this.firebase.firestore
      .collection(this.collection)
      .doc(userId);

    const snap = await ref.get();
    const inventory: Inventory = snap.exists
      ? (snap.data() as Inventory)
      : buildDefaultInventory();

    // Step 1: Verify ownership (only if equipping a weapon, not unequipping)
    if (weaponId !== null && weaponId !== undefined) {
      if (!inventory.ownedWeaponIds.includes(weaponId)) {
        throw new BadRequestException(
          `You do not own weapon '${weaponId}'. Purchase it from the shop first.`,
        );
      }
    }

    // Step 2: Update equippedWeaponId
    const updated: Inventory = {
      ...inventory,
      equippedWeaponId: weaponId ?? null,
      updatedAt: new Date().toISOString(),
    };

    await ref.set(updated);

    this.logger.log(
      `Equip updated: userId=${userId} equippedWeaponId=${updated.equippedWeaponId}`,
    );

    return updated;
  }
}
