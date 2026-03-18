import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { BattleType, ZoneId } from '@eureka-lab/shared-types';

/**
 * DTO for initiating a new combat battle session.
 *
 * @param battleType - Type of battle (minion | guardian | overlord)
 * @param zoneId - Zone the battle takes place in (required for minion/guardian)
 * @param missionId - Mission that triggered this battle (optional, for context)
 */
export class InitBattleDto {
  /** Type of battle — determines zombie, HP values, and question count */
  @IsEnum(['minion', 'guardian', 'overlord'])
  battleType!: BattleType;

  /**
   * Zone ID — required for minion and guardian battles.
   * Not required for the overlord (pulls from all zones).
   */
  @IsOptional()
  @IsEnum(['library', 'forge', 'citadel', 'academy'])
  zoneId?: ZoneId;

  /** ID of the learning mission that triggered this battle */
  @IsOptional()
  @IsString()
  missionId?: string;
}
