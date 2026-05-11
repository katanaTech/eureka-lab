import { Module } from '@nestjs/common';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { GamificationModule } from '../gamification/gamification.module';

/**
 * Combat module — battle initialisation, outcome recording, and certificate generation.
 * Imports GamificationModule to access BadgeService for post-victory badge awards.
 */
@Module({
  imports: [GamificationModule],
  controllers: [CombatController],
  providers: [CombatService],
})
export class CombatModule {}
