import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for equipping or unequipping a weapon.
 * Send weaponId: null to unequip (go unarmed).
 */
export class EquipWeaponDto {
  /**
   * ID of the weapon to equip, or null to unequip.
   * The player must already own the weapon to equip it.
   */
  @IsOptional()
  @IsString()
  weaponId!: string | null;
}
