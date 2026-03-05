/**
 * Controller for push notification endpoints.
 * Handles device registration, preference management, and COPPA compliance.
 * CLAUDE.md Rule 10: All endpoints have input validation via DTOs.
 * CLAUDE.md Rule 13: No child profile data in push payloads.
 *
 * @module notifications.controller
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import type {
  DeviceRegistration,
  NotificationPreferences,
  DevicePlatform,
} from '@eureka-lab/shared-types';

/**
 * NotificationsController provides push notification management endpoints.
 * Routes: POST /notifications/register
 *         DELETE /notifications/unregister
 *         GET /notifications/preferences
 *         PUT /notifications/preferences
 *
 * COPPA: Child accounts require parent opt-in before notifications are sent.
 * The preference check happens in the push delivery service, not here.
 */
@Controller('notifications')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Register a push subscription for the current user.
   * Stores the Web Push endpoint and keys for later delivery.
   *
   * @param user - Authenticated user
   * @param body - Device registration data
   * @returns The registered device record
   */
  @Post('register')
  @Roles('child', 'parent', 'teacher', 'admin')
  async registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RegisterDeviceDto,
  ): Promise<DeviceRegistration> {
    this.logger.log({
      event: 'register_device_request',
      userId: user.uid,
      platform: body.platform,
    });

    return this.notificationsService.registerDevice(
      user.uid,
      body.endpoint,
      body.keys,
      body.platform as DevicePlatform,
    );
  }

  /**
   * Unregister a push subscription for the current user.
   *
   * @param user - Authenticated user
   * @param body - Contains the endpoint to unregister
   */
  @Delete('unregister')
  @Roles('child', 'parent', 'teacher', 'admin')
  async unregisterDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { endpoint: string },
  ): Promise<{ message: string }> {
    await this.notificationsService.unregisterDevice(user.uid, body.endpoint);

    this.logger.log({
      event: 'unregister_device_request',
      userId: user.uid,
    });

    return { message: 'Device unregistered' };
  }

  /**
   * Get notification preferences for the current user.
   * Returns defaults if no preferences have been set.
   *
   * @param user - Authenticated user
   * @returns Notification preferences
   */
  @Get('preferences')
  @Roles('child', 'parent', 'teacher', 'admin')
  async getPreferences(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationPreferences> {
    return this.notificationsService.getPreferences(user.uid);
  }

  /**
   * Update notification preferences for the current user.
   * Merges with existing preferences.
   *
   * @param user - Authenticated user
   * @param body - Partial preferences to update
   * @returns Updated notification preferences
   */
  @Put('preferences')
  @Roles('child', 'parent', 'teacher', 'admin')
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    this.logger.log({
      event: 'update_preferences_request',
      userId: user.uid,
      keys: Object.keys(body),
    });

    return this.notificationsService.updatePreferences(user.uid, body);
  }
}
