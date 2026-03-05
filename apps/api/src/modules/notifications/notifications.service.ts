/**
 * Service for managing push notification subscriptions and preferences.
 * Handles device registration, preference storage, and subscription cleanup.
 * CLAUDE.md Rule 3: All Firestore queries include userId filter.
 * CLAUDE.md Rule 5: All child data validated before write.
 *
 * @module notifications.service
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type {
  DeviceRegistration,
  NotificationPreferences,
  DevicePlatform,
  PushSubscriptionKeys,
} from '@eureka-lab/shared-types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@eureka-lab/shared-types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Register a push subscription for a user.
   * Creates or updates the device document under users/{uid}/devices/{deviceId}.
   * CLAUDE.md Rule 3: userId filter via subcollection path.
   *
   * @param userId - Firebase UID
   * @param endpoint - Web Push endpoint URL
   * @param keys - Web Push encryption keys
   * @param platform - Device platform (web, android, ios)
   * @returns The registered device document
   */
  async registerDevice(
    userId: string,
    endpoint: string,
    keys: PushSubscriptionKeys,
    platform: DevicePlatform,
  ): Promise<DeviceRegistration> {
    /** Use endpoint hash as device ID for idempotent upserts */
    const deviceId = this.hashEndpoint(endpoint);
    const now = new Date().toISOString();

    const device: DeviceRegistration = {
      id: deviceId,
      endpoint,
      keys,
      createdAt: now,
      lastActiveAt: now,
      platform,
    };

    await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('devices')
      .doc(deviceId)
      .set(device);

    this.logger.log({
      event: 'device_registered',
      userId,
      deviceId,
      platform,
    });

    return device;
  }

  /**
   * Unregister a push subscription for a user.
   * Removes the device document.
   *
   * @param userId - Firebase UID
   * @param endpoint - Web Push endpoint URL to unregister
   */
  async unregisterDevice(userId: string, endpoint: string): Promise<void> {
    const deviceId = this.hashEndpoint(endpoint);

    await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('devices')
      .doc(deviceId)
      .delete();

    this.logger.log({
      event: 'device_unregistered',
      userId,
      deviceId,
    });
  }

  /**
   * Get all registered devices for a user.
   * CLAUDE.md Rule 3: userId scoped via subcollection path.
   *
   * @param userId - Firebase UID
   * @returns Array of registered devices
   */
  async getUserDevices(userId: string): Promise<DeviceRegistration[]> {
    const snapshot = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('devices')
      .get();

    return snapshot.docs.map((doc) => doc.data() as DeviceRegistration);
  }

  /**
   * Get notification preferences for a user.
   * Returns defaults if no preferences document exists.
   *
   * @param userId - Firebase UID
   * @returns User's notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const doc = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('preferences')
      .doc('notifications')
      .get();

    if (!doc.exists) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    return doc.data() as NotificationPreferences;
  }

  /**
   * Update notification preferences for a user.
   * Merges with existing preferences.
   *
   * @param userId - Firebase UID
   * @param updates - Partial preferences to merge
   * @returns Updated notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const prefsRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('preferences')
      .doc('notifications');

    await prefsRef.set(updates, { merge: true });

    const updated = await prefsRef.get();
    const merged = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(updated.data() as Partial<NotificationPreferences>),
    };

    this.logger.log({
      event: 'preferences_updated',
      userId,
      keys: Object.keys(updates),
    });

    return merged;
  }

  /**
   * Remove expired or failed device subscriptions.
   * Called when push delivery returns HTTP 410 (Gone).
   *
   * @param userId - Firebase UID
   * @param endpoint - The expired endpoint URL
   */
  async removeExpiredDevice(userId: string, endpoint: string): Promise<void> {
    const deviceId = this.hashEndpoint(endpoint);

    await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('devices')
      .doc(deviceId)
      .delete();

    this.logger.warn({
      event: 'expired_device_removed',
      userId,
      deviceId,
    });
  }

  /**
   * Create a simple hash of the endpoint URL for use as document ID.
   * Uses a basic string hash — sufficient for endpoint deduplication.
   *
   * @param endpoint - Web Push endpoint URL
   * @returns A hex string hash suitable for Firestore document IDs
   */
  private hashEndpoint(endpoint: string): string {
    let hash = 0;
    for (let i = 0; i < endpoint.length; i++) {
      const char = endpoint.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
