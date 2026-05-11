import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import type { FantasyClass } from '@eureka-lab/shared-types';

/**
 * DTO for creating or updating a user's fantasy character.
 * Validated before persisting to Firestore per CLAUDE.md Rule 5.
 */
export class SaveCharacterDto {
  /**
   * Display name chosen by the player (2–30 characters).
   */
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name!: string;

  /**
   * The fantasy class assigned to this character.
   */
  @IsEnum(['mage', 'engineer', 'rogue', 'warrior'])
  class!: FantasyClass;

  /**
   * HSL triplet string for the class aura colour, e.g. '268 70% 60%'.
   */
  @IsString()
  classColorHsl!: string;

  /**
   * Cosmetic narrative weapon name for display purposes.
   */
  @IsString()
  weaponName!: string;
}
