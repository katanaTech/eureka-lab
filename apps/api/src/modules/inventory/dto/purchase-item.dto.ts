import { IsString, IsEnum } from 'class-validator';
import type { ShopItemType } from '@eureka-lab/shared-types';

/**
 * DTO for purchasing a shop item (ability or weapon).
 * Validated before the atomic Firestore transaction in InventoryService.
 */
export class PurchaseItemDto {
  /**
   * Unique identifier of the item to purchase.
   * Must correspond to a valid entry in the shop catalog.
   */
  @IsString()
  itemId!: string;

  /**
   * Item category — determines which catalog list and which ownedIds array to update.
   * Must be 'ability' or 'weapon'.
   */
  @IsEnum(['ability', 'weapon'])
  itemType!: ShopItemType;
}
