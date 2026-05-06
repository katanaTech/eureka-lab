import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { GamificationModule } from '../gamification/gamification.module';
import { InventoryModule } from '../inventory/inventory.module';
import { TenantsModule } from '../tenants/tenants.module';

/**
 * Progress module — module completion tracking and XP management.
 * Imports GamificationModule for badge and streak integration.
 * Imports InventoryModule and TenantsModule for mode-conditional KP awards.
 */
@Module({
  imports: [GamificationModule, InventoryModule, TenantsModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
