import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { FantasyCharacter } from '@eureka-lab/shared-types';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UsersRepository } from './users.repository';
import { SaveCharacterDto } from './dto/save-character.dto';

/**
 * Users controller — exposes character management endpoints.
 * All routes require a valid Firebase session and are accessible to any role.
 */
@Controller('users')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('child', 'parent', 'teacher', 'admin')
export class UsersController {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Get the authenticated user's fantasy character.
   * Returns 404 if no character has been created yet.
   * @param user - Current authenticated user
   * @returns The user's FantasyCharacter
   */
  @Get('me/character')
  @HttpCode(HttpStatus.OK)
  async getCharacter(@CurrentUser() user: AuthenticatedUser): Promise<FantasyCharacter> {
    const character = await this.usersRepository.getCharacter(user.uid);
    if (character === null) {
      throw new NotFoundException('No character found. Create one first.');
    }
    return character;
  }

  /**
   * Create or update the authenticated user's fantasy character.
   * Sets createdAt to now if this is the first save; preserves it on update.
   * @param user - Current authenticated user
   * @param dto - Character data to save
   * @returns The saved FantasyCharacter
   */
  @Put('me/character')
  @HttpCode(HttpStatus.OK)
  async saveCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveCharacterDto,
  ): Promise<FantasyCharacter> {
    const existing = await this.usersRepository.getCharacter(user.uid);
    const character: FantasyCharacter = {
      name: dto.name,
      class: dto.class,
      classColorHsl: dto.classColorHsl,
      weaponName: dto.weaponName,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await this.usersRepository.setCharacter(user.uid, character);
    return character;
  }
}
