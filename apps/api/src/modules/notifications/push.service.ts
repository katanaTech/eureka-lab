/**
 * Service for sending Web Push notifications.
 * Abstracts the web-push library (CLAUDE.md Rule 18).
 * Handles VAPID configuration, delivery, and expired subscription cleanup.
 *
 * VAPID keys must be set in environment variables:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 *
 * @module push.service
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { NotificationsService } from './notifications.service';
import type {
  DeviceRegistration,
  PushNotificationPayload,
} from '@eureka-lab/shared-types';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Initialize VAPID details on module startup.
   * Gracefully degrades if VAPID keys are not configured.
   */
  onModuleInit(): void {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@eurekalab.app';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.isConfigured = true;
      this.logger.log({ event: 'vapid_configured', status: 'ready' });
    } else {
      this.logger.warn({
        event: 'vapid_not_configured',
        message: 'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY not set. Push notifications disabled.',
      });
    }
  }

  /**
   * Get the VAPID public key for client-side subscription.
   * @returns VAPID public key or null if not configured
   */
  getVapidPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  /**
   * Send a push notification to a specific user.
   * Delivers to all registered devices for the user.
   * Automatically removes expired subscriptions (HTTP 410).
   *
   * @param userId - Firebase UID of the recipient
   * @param payload - Notification payload (title, body, url, etc.)
   * @returns Number of successfully delivered notifications
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<number> {
    if (!this.isConfigured) {
      this.logger.warn({
        event: 'push_skipped',
        reason: 'vapid_not_configured',
        userId,
      });
      return 0;
    }

    const devices = await this.notificationsService.getUserDevices(userId);

    if (devices.length === 0) {
      return 0;
    }

    let delivered = 0;

    for (const device of devices) {
      try {
        await this.sendToDevice(device, payload);
        delivered++;
      } catch (error: unknown) {
        await this.handleDeliveryError(userId, device, error);
      }
    }

    this.logger.log({
      event: 'push_batch_complete',
      userId,
      totalDevices: devices.length,
      delivered,
    });

    return delivered;
  }

  /**
   * Send a push notification to a single device.
   *
   * @param device - Registered device
   * @param payload - Notification payload
   */
  private async sendToDevice(
    device: DeviceRegistration,
    payload: PushNotificationPayload,
  ): Promise<void> {
    const subscription: webPush.PushSubscription = {
      endpoint: device.endpoint,
      keys: {
        p256dh: device.keys.p256dh,
        auth: device.keys.auth,
      },
    };

    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour TTL
        urgency: 'normal',
      },
    );
  }

  /**
   * Handle delivery errors — remove expired subscriptions, log others.
   *
   * @param userId - Firebase UID
   * @param device - The device that failed
   * @param error - The error from web-push
   */
  private async handleDeliveryError(
    userId: string,
    device: DeviceRegistration,
    error: unknown,
  ): Promise<void> {
    const webPushError = error as { statusCode?: number; body?: string };

    /** HTTP 410 Gone — subscription expired, auto-cleanup */
    if (webPushError.statusCode === 410) {
      await this.notificationsService.removeExpiredDevice(userId, device.endpoint);
      this.logger.warn({
        event: 'push_expired_removed',
        userId,
        deviceId: device.id,
      });
      return;
    }

    /** HTTP 404 — subscription not found, also cleanup */
    if (webPushError.statusCode === 404) {
      await this.notificationsService.removeExpiredDevice(userId, device.endpoint);
      this.logger.warn({
        event: 'push_not_found_removed',
        userId,
        deviceId: device.id,
      });
      return;
    }

    /** Other errors — log but don't remove */
    this.logger.error({
      event: 'push_delivery_failed',
      userId,
      deviceId: device.id,
      statusCode: webPushError.statusCode,
      body: webPushError.body,
    });
  }
}
