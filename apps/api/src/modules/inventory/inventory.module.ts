import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

/**
 * Inventory module — player inventory retrieval, shop catalog, item purchases,
 * and weapon equip/unequip.
 *
 * FirebaseService is provided globally via InfrastructureModule imported in AppModule,
 * so this module requires no explicit imports.
 */
@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
