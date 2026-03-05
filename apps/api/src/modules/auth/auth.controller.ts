import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AddChildDto } from './dto/add-child.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Auth controller — handles all authentication and account management endpoints.
 * Matches the OpenAPI spec in planning/api-contracts.md.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Create a new parent account.
   * @param dto - Signup request body
   * @returns Created user with token
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  /**
   * Exchange a Firebase ID token for an enriched user profile.
   * @param dto - Login request body with idToken
   * @returns Enriched user profile with role, plan, xp, children
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.idToken);
  }

  /**
   * Revoke all sessions for the authenticated user.
   * @param user - Current authenticated user
   */
  @Post('logout')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.uid);
  }

  /**
   * Get the current authenticated user's full profile.
   * @param user - Current authenticated user
   * @returns Full user profile with streak and children
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.uid);
  }

  /**
   * Add a child sub-account under the authenticated parent.
   * Maximum 5 children per parent. Child must be 8-16 years old.
   * @param user - Current authenticated parent
   * @param dto - Child data (displayName, birthYear)
   * @returns Created child account info
   */
  @Post('add-child')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('parent')
  @HttpCode(HttpStatus.CREATED)
  async addChild(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddChildDto) {
    return this.authService.addChild(user.uid, dto);
  }

  /**
   * Send a verification email to the authenticated user.
   * @param user - Current authenticated user
   */
  @Post('verify-email')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.sendEmailVerification(user.uid);
  }
}
