import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { CombatService } from './combat.service';
import { InitBattleDto } from './dto/init-battle.dto';
import { CompleteBattleDto } from './dto/complete-battle.dto';
import type { BattleConfig } from '@eureka-lab/shared-types';

/**
 * Controller for the combat system.
 * All endpoints require a verified Firebase auth token and the child role.
 *
 * Routes:
 *   POST /combat/init               — start a new battle session
 *   POST /combat/:battleId/complete — record battle outcome and award XP
 *   POST /combat/certificate        — generate AI champion certificate (overlord victory)
 */
@Controller('combat')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('child')
export class CombatController {
  private readonly logger = new Logger(CombatController.name);

  constructor(private readonly combatService: CombatService) {}

  /**
   * Initialise a new battle session.
   * Returns the full BattleConfig consumed by the frontend CombatArena.
   *
   * @param user - Authenticated child user (injected by FirebaseAuthGuard)
   * @param dto - Battle init parameters (battleType, optional zoneId and missionId)
   * @returns BattleConfig with battle ID, zombie details, HP values, and question set
   */
  @Post('init')
  async initBattle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitBattleDto,
  ): Promise<BattleConfig> {
    this.logger.log(`initBattle: userId=${user.uid} type=${dto.battleType}`);
    return this.combatService.initBattle(user.uid, dto);
  }

  /**
   * Record the outcome of a completed battle and award XP on victory.
   *
   * @param user - Authenticated child user
   * @param battleId - The battle session ID returned by initBattle
   * @param dto - Outcome and performance data
   * @returns XP awarded and any badge IDs unlocked
   */
  @Post(':battleId/complete')
  async completeBattle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('battleId') battleId: string,
    @Body() dto: CompleteBattleDto,
  ): Promise<{ xpAwarded: number; badgesUnlocked: string[] }> {
    this.logger.log(
      `completeBattle: userId=${user.uid} battleId=${battleId} outcome=${dto.outcome}`,
    );
    return this.combatService.completeBattle(user.uid, battleId, dto);
  }

  /**
   * Generate the AI Champion certificate after defeating the Anti-AI Overlord.
   * Returns a signed Firebase Storage URL valid for 24 hours.
   *
   * @param user - Authenticated child user
   * @param body - The child's display name to embed in the certificate
   * @returns Signed URL pointing to the generated SVG certificate
   */
  @Post('certificate')
  async generateCertificate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { displayName: string },
  ): Promise<{ certificateUrl: string }> {
    this.logger.log(`generateCertificate: userId=${user.uid}`);
    return this.combatService.generateCertificate(user.uid, body.displayName || 'Champion');
  }
}
