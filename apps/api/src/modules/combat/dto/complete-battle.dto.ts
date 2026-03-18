import { IsEnum, IsInt, Min, Max } from 'class-validator';
import type { BattleOutcome } from '@eureka-lab/shared-types';

/**
 * DTO for reporting the outcome of a completed battle.
 *
 * @param outcome - Whether the player won or lost
 * @param correctAnswers - Number of questions answered correctly
 * @param totalQuestions - Total questions in this battle
 */
export class CompleteBattleDto {
  /** Final outcome of the battle */
  @IsEnum(['victory', 'defeat'])
  outcome!: BattleOutcome;

  /** Number of questions the player answered correctly */
  @IsInt()
  @Min(0)
  @Max(20)
  correctAnswers!: number;

  /** Total number of questions in this battle session */
  @IsInt()
  @Min(1)
  @Max(20)
  totalQuestions!: number;
}
