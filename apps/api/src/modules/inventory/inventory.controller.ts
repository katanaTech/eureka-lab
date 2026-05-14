import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { EquipWeaponDto } from './dto/equip-weapon.dto';
import type { Inventory, ShopCatalog } from '@eureka-lab/shared-types';

/**
 * Controller for the inventory and shop system.
 * All endpoints require a verified Firebase auth token and the child role.
 *
 * Routes:
 *   GET  /inventory           — fetch user's inventory document
 *   GET  /shop/catalog        — fetch hardcoded shop catalog
 *   POST /inventory/buy       — purchase an ability or weapon (atomic transaction)
 *   POST /inventory/equip     — equip or unequip a weapon
 */
@Controller()
@UseGuards(FirebaseAuthGuard, RolesGuard)
// Plan 2 (ADR-006) tightened this back to 'child' only. Welcome's "Begin Quest"
// tab now creates child-role accounts (ages 13–16); adults sign up via /signup
// and stay as 'parent' role (which doesn't need inventory access).
@Roles('child')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Retrieve the authenticated user's inventory.
   * Lazily creates a default inventory document if none exists.
   *
   * @param user - Authenticated child user (injected by FirebaseAuthGuard)
   * @returns The user's Inventory document
   */
  @Get('inventory')
  async getInventory(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Inventory> {
    this.logger.log(`getInventory: userId=${user.uid}`);
    return this.inventoryService.getInventory(user.uid);
  }

  /**
   * Return the full hardcoded shop catalog (abilities + weapons).
   *
   * @param user - Authenticated child user (injected by FirebaseAuthGuard)
   * @returns The ShopCatalog with all purchasable items
   */
  @Get('shop/catalog')
  getCatalog(
    @CurrentUser() user: AuthenticatedUser,
  ): ShopCatalog {
    this.logger.log(`getCatalog: userId=${user.uid}`);
    return this.inventoryService.getCatalog();
  }

  /**
   * Purchase an item from the shop using an atomic Firestore transaction.
   * Returns the updated inventory after the purchase.
   *
   * @param user - Authenticated child user
   * @param dto - Item purchase parameters (itemId + itemType)
   * @returns Updated Inventory after the purchase
   */
  @Post('inventory/buy')
  async purchaseItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PurchaseItemDto,
  ): Promise<Inventory> {
    this.logger.log(
      `purchaseItem: userId=${user.uid} itemId=${dto.itemId} itemType=${dto.itemType}`,
    );
    return this.inventoryService.purchaseItem(user.uid, dto);
  }

  /**
   * Equip or unequip a weapon on the user's character.
   * Validates that the user owns the requested weapon before equipping.
   *
   * @param user - Authenticated child user
   * @param dto - weaponId to equip, or null to unequip
   * @returns Updated Inventory after the equip change
   */
  @Post('inventory/equip')
  async equipWeapon(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EquipWeaponDto,
  ): Promise<Inventory> {
    this.logger.log(
      `equipWeapon: userId=${user.uid} weaponId=${dto.weaponId}`,
    );
    return this.inventoryService.equipWeapon(user.uid, dto);
  }
}
