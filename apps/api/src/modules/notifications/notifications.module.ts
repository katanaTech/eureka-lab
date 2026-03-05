/**
 * Notifications module — push subscription management and delivery.
 * Exports NotificationsService and PushService for use by other modules
 * (e.g., gamification badge events, progress milestone events).
 *
 * @module notifications.module
 */

import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, NotificationSchedulerService],
  exports: [NotificationsService, PushService, NotificationSchedulerService],
})
export class NotificationsModule {}
