/**
 * Service for scheduling and triggering push notifications.
 * Provides methods called by other modules (gamification, progress)
 * to send contextual notifications.
 *
 * In production, these methods would be called from BullMQ job processors.
 * For MVP, they are direct method calls invoked by event triggers.
 *
 * CLAUDE.md Rule 11: Child safety preamble in all AI interactions (N/A here).
 * CLAUDE.md Rule 13: No child profile data in push payloads.
 *
 * @module notification-scheduler.service
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { PushService } from './push.service';
import { NotificationsService } from './notifications.service';
import type { PushNotificationPayload, NotificationType } from '@eureka-lab/shared-types';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly pushService: PushService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Send a streak reminder to a user.
   * Called when a user hasn't been active today and their streak is at risk.
   *
   * @param userId - Firebase UID
   * @param currentStreak - Current streak day count
   */
  async sendStreakReminder(userId: string, currentStreak: number): Promise<void> {
    const prefs = await this.notificationsService.getPreferences(userId);

    if (!prefs.notificationsEnabled || !prefs.streakReminders) {
      return;
    }

    const payload: PushNotificationPayload = {
      type: 'streak_reminder',
      title: `Don't lose your ${currentStreak}-day streak! 🔥`,
      body: 'Complete one activity today to keep your streak going.',
      url: '/m/learn',
      icon: '/icons/icon-192x192.png',
    };

    const delivered = await this.pushService.sendToUser(userId, payload);

    this.logger.log({
      event: 'streak_reminder_sent',
      userId,
      currentStreak,
      delivered,
    });
  }

  /**
   * Send a badge earned notification to a user.
   * Called immediately when the gamification service awards a badge.
   *
   * @param userId - Firebase UID
   * @param badgeName - Display name of the earned badge
   */
  async sendBadgeEarned(userId: string, badgeName: string): Promise<void> {
    const prefs = await this.notificationsService.getPreferences(userId);

    if (!prefs.notificationsEnabled || !prefs.newBadges) {
      return;
    }

    const payload: PushNotificationPayload = {
      type: 'badge_earned',
      title: `Badge Unlocked: ${badgeName}! 🏆`,
      body: 'Great job! Check out your new achievement.',
      url: '/m/progress',
      icon: '/icons/icon-192x192.png',
    };

    const delivered = await this.pushService.sendToUser(userId, payload);

    this.logger.log({
      event: 'badge_notification_sent',
      userId,
      badgeName,
      delivered,
    });
  }

  /**
   * Send a parent alert about child inactivity.
   * Called when a child hasn't been active for a configured threshold.
   * CLAUDE.md Rule 13: Only first name used, no school/age data.
   *
   * @param parentId - Parent's Firebase UID
   * @param childFirstName - Child's first name only (anonymized)
   * @param inactiveDays - Number of days since last activity
   */
  async sendParentAlert(
    parentId: string,
    childFirstName: string,
    inactiveDays: number,
  ): Promise<void> {
    const prefs = await this.notificationsService.getPreferences(parentId);

    if (!prefs.notificationsEnabled || !prefs.parentAlerts) {
      return;
    }

    const payload: PushNotificationPayload = {
      type: 'parent_alert',
      title: `${childFirstName} needs encouragement`,
      body: `${childFirstName} hasn't practiced AI in ${inactiveDays} days.`,
      url: '/parent',
      icon: '/icons/icon-192x192.png',
    };

    const delivered = await this.pushService.sendToUser(parentId, payload);

    this.logger.log({
      event: 'parent_alert_sent',
      parentId,
      inactiveDays,
      delivered,
    });
  }

  /**
   * Send a teacher update about classroom progress.
   *
   * @param teacherId - Teacher's Firebase UID
   * @param classroomName - Classroom display name
   * @param completionsToday - Number of module completions today
   */
  async sendTeacherUpdate(
    teacherId: string,
    classroomName: string,
    completionsToday: number,
  ): Promise<void> {
    const prefs = await this.notificationsService.getPreferences(teacherId);

    if (!prefs.notificationsEnabled) {
      return;
    }

    const payload: PushNotificationPayload = {
      type: 'teacher_update',
      title: `${classroomName} Update`,
      body: `${completionsToday} students completed modules today.`,
      url: '/teacher',
      icon: '/icons/icon-192x192.png',
    };

    const delivered = await this.pushService.sendToUser(teacherId, payload);

    this.logger.log({
      event: 'teacher_update_sent',
      teacherId,
      classroomName,
      completionsToday,
      delivered,
    });
  }

  /**
   * Send a weekly progress report to a user.
   *
   * @param userId - Firebase UID
   * @param xpEarned - XP earned this week
   * @param streakDays - Current streak length
   */
  async sendWeeklyReport(
    userId: string,
    xpEarned: number,
    streakDays: number,
  ): Promise<void> {
    const prefs = await this.notificationsService.getPreferences(userId);

    if (!prefs.notificationsEnabled || !prefs.weeklyReport) {
      return;
    }

    const payload: PushNotificationPayload = {
      type: 'weekly_report',
      title: 'Your Weekly AI Progress 📊',
      body: `This week: ${xpEarned} XP earned, ${streakDays}-day streak!`,
      url: '/m/progress',
      icon: '/icons/icon-192x192.png',
    };

    const delivered = await this.pushService.sendToUser(userId, payload);

    this.logger.log({
      event: 'weekly_report_sent',
      userId,
      xpEarned,
      streakDays,
      delivered,
    });
  }
}
