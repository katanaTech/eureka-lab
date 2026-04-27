import { Module } from '@nestjs/common';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { GamificationModule } from '../gamification/gamification.module';
import { InventoryModule } from '../inventory/inventory.module';
import { TenantsModule } from '../tenants/tenants.module';

/**
 * Combat module — battle initialisation, outcome recording, and certificate generation.
 * Imports GamificationModule to access BadgeService for post-victory badge awards.
 * Imports InventoryModule and TenantsModule for mode-conditional KP awards on victory.
 */
@Module({
  imports: [GamificationModule, InventoryModule, TenantsModule],
  controllers: [CombatController],
  providers: [CombatService],
})
export class CombatModule {}
