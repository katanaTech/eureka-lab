/**
 * Service for evaluating and awarding badges to users.
 * Badges are stored in Firestore subcollection: users/{uid}/badges/{badgeId}
 *
 * @module badge.service
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { Badge, GamificationEvent } from '@eureka-lab/shared-types';
import {
  BADGE_DEFINITIONS,
  type BadgeConditionContext,
} from './badge-definitions';

/** Result from a badge check — lists newly awarded badges */
export interface BadgeCheckResult {
  /** Badges newly awarded during this check */
  newBadges: Badge[];
}

/**
 * BadgeService evaluates badge conditions and awards badges.
 * Uses Firestore subcollection: users/{uid}/badges/{badgeId}
 */
@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Get all earned badges for a user.
   * @param userId - User UID
   * @returns Array of earned badges
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    const snapshot = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('badges')
      .orderBy('earnedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data['badgeId'] as string,
        name: data['name'] as string,
        description: data['description'] as string,
        iconUrl: data['iconUrl'] as string,
        category: data['category'] as Badge['category'],
        unlockedAt: data['earnedAt'] as string,
      };
    });
  }

  /**
   * Check all badge conditions and award any newly earned badges.
   * This is idempotent — already-earned badges are skipped.
   *
   * @param userId - User UID
   * @param event - The gamification event that triggered this check
   * @returns Result with any newly awarded badges
   */
  async checkAndAwardBadges(
    userId: string,
    event: GamificationEvent,
  ): Promise<BadgeCheckResult> {
    const [earnedBadgeIds, context] = await Promise.all([
      this.getEarnedBadgeIds(userId),
      this.buildConditionContext(userId),
    ]);

    const newBadges: Badge[] = [];

    for (const def of BADGE_DEFINITIONS) {
      /* Skip already earned */
      if (earnedBadgeIds.has(def.id)) continue;

      /* Evaluate condition */
      if (def.condition(context)) {
        await this.awardBadge(userId, def.id);
        newBadges.push({
          id: def.id,
          name: def.name,
          description: def.description,
          iconUrl: def.iconUrl,
          category: def.category,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    if (newBadges.length > 0) {
      this.logger.log({
        event: 'badges_awarded',
        userId,
        trigger: event.type,
        badges: newBadges.map((b) => b.id),
      });
    }

    return { newBadges };
  }

  /**
   * Award a single badge to a user (idempotent).
   * @param userId - User UID
   * @param badgeId - Badge identifier
   */
  private async awardBadge(
    userId: string,
    badgeId: string,
  ): Promise<void> {
    const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!def) return;

    const badgeRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('badges')
      .doc(badgeId);

    const existing = await badgeRef.get();
    if (existing.exists) return;

    await badgeRef.set({
      badgeId: def.id,
      name: def.name,
      description: def.description,
      iconUrl: def.iconUrl,
      category: def.category,
      earnedAt: new Date().toISOString(),
    });
  }

  /**
   * Get the set of badge IDs already earned by a user.
   * @param userId - User UID
   * @returns Set of earned badge IDs
   */
  private async getEarnedBadgeIds(userId: string): Promise<Set<string>> {
    const snapshot = await this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('badges')
      .get();

    return new Set(snapshot.docs.map((doc) => doc.id));
  }

  /**
   * Build the condition context by aggregating user stats from Firestore.
   * @param userId - User UID
   * @returns Badge condition context with aggregated stats
   */
  private async buildConditionContext(
    userId: string,
  ): Promise<BadgeConditionContext> {
    const [userDoc, progressSnap, statsDoc, workflowStatsDoc, projectStatsDoc, agentStatsDoc] =
      await Promise.all([
        this.firebase.firestore.collection('users').doc(userId).get(),
        this.firebase.firestore
          .collection('progress')
          .where('userId', '==', userId)
          .get(),
        this.firebase.firestore
          .collection('users')
          .doc(userId)
          .collection('stats')
          .doc('prompt-stats')
          .get(),
        this.firebase.firestore
          .collection('users')
          .doc(userId)
          .collection('stats')
          .doc('workflow-stats')
          .get(),
        this.firebase.firestore
          .collection('users')
          .doc(userId)
          .collection('stats')
          .doc('project-stats')
          .get(),
        this.firebase.firestore
          .collection('users')
          .doc(userId)
          .collection('stats')
          .doc('agent-stats')
          .get(),
      ]);

    const userData = userDoc.data() ?? {};
    const streak = (userData['streak'] as number) ?? 0;

    /* Prompt stats from subcollection */
    const statsData = statsDoc.exists ? statsDoc.data() ?? {} : {};
    const totalPrompts = (statsData['totalPrompts'] as number) ?? 0;
    const bestPromptScore = (statsData['bestPromptScore'] as number) ?? 0;
    const promptsWithContext =
      (statsData['promptsWithContext'] as number) ?? 0;
    const activityTypesRaw =
      (statsData['activityTypes'] as string[]) ?? [];

    /* Progress aggregation */
    let totalModulesCompleted = 0;
    let totalActivitiesCompleted = 0;
    const completedModuleIds = new Set<string>();

    for (const doc of progressSnap.docs) {
      const data = doc.data();
      const completed = data['completed'] as boolean;
      const activities = (data['completedActivities'] as number[]) ?? [];
      totalActivitiesCompleted += activities.length;

      if (completed) {
        totalModulesCompleted++;
        completedModuleIds.add(data['moduleId'] as string);
      }
    }

    /* Workflow stats from subcollection */
    const wfData = workflowStatsDoc.exists
      ? workflowStatsDoc.data() ?? {}
      : {};
    const totalWorkflowsCreated =
      (wfData['totalWorkflowsCreated'] as number) ?? 0;
    const totalWorkflowRuns =
      (wfData['totalWorkflowRuns'] as number) ?? 0;
    const customizedWorkflows =
      (wfData['customizedWorkflows'] as number) ?? 0;
    const runsByTemplateRaw =
      (wfData['runsByTemplate'] as Record<string, number>) ?? {};
    const workflowRunsByTemplate = new Map<string, number>(
      Object.entries(runsByTemplateRaw),
    );

    /* Project stats from subcollection */
    const projData = projectStatsDoc.exists
      ? projectStatsDoc.data() ?? {}
      : {};
    const totalProjectsCreated =
      (projData['totalProjectsCreated'] as number) ?? 0;
    const totalCodeGenerations =
      (projData['totalCodeGenerations'] as number) ?? 0;
    const totalProjectUpdates =
      (projData['totalProjectUpdates'] as number) ?? 0;

    /* Agent stats from subcollection */
    const agentData = agentStatsDoc.exists
      ? agentStatsDoc.data() ?? {}
      : {};
    const totalAgentsCreated =
      (agentData['totalAgentsCreated'] as number) ?? 0;
    const totalAgentChats =
      (agentData['totalAgentChats'] as number) ?? 0;
    const agentPersonaCustomizations =
      (agentData['agentPersonaCustomizations'] as number) ?? 0;

    return {
      totalPrompts,
      totalModulesCompleted,
      currentStreak: streak,
      completedModuleIds,
      totalActivitiesCompleted,
      bestPromptScore,
      promptsWithContext,
      activityTypesCompleted: new Set(activityTypesRaw),
      totalWorkflowsCreated,
      totalWorkflowRuns,
      customizedWorkflows,
      workflowRunsByTemplate,
      totalProjectsCreated,
      totalCodeGenerations,
      totalProjectUpdates,
      totalAgentsCreated,
      totalAgentChats,
      agentPersonaCustomizations,
    };
  }

  /**
   * Update workflow statistics for badge evaluation.
   * Tracks workflow creation, run counts, and template usage.
   *
   * @param userId - User UID
   * @param params - Workflow event parameters
   */
  async recordWorkflowStats(
    userId: string,
    params: {
      action: 'created' | 'run' | 'customized';
      templateId?: string;
    },
  ): Promise<void> {
    const statsRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('workflow-stats');

    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(statsRef);
      const data = doc.exists ? doc.data() ?? {} : {};

      const totalWorkflowsCreated =
        ((data['totalWorkflowsCreated'] as number) ?? 0) +
        (params.action === 'created' ? 1 : 0);
      const totalWorkflowRuns =
        ((data['totalWorkflowRuns'] as number) ?? 0) +
        (params.action === 'run' ? 1 : 0);
      const customizedWorkflows =
        ((data['customizedWorkflows'] as number) ?? 0) +
        (params.action === 'customized' ? 1 : 0);

      const runsByTemplate: Record<string, number> =
        (data['runsByTemplate'] as Record<string, number>) ?? {};
      if (params.action === 'run' && params.templateId) {
        runsByTemplate[params.templateId] =
          (runsByTemplate[params.templateId] ?? 0) + 1;
      }

      tx.set(statsRef, {
        totalWorkflowsCreated,
        totalWorkflowRuns,
        customizedWorkflows,
        runsByTemplate,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  /**
   * Update prompt statistics for badge evaluation.
   * Tracks total prompts, best score, context usage, and activity types.
   *
   * @param userId - User UID
   * @param params - Prompt parameters
   */
  async recordPromptStats(
    userId: string,
    params: {
      promptScore?: number;
      hasContext?: boolean;
      activityType?: string;
    },
  ): Promise<void> {
    const statsRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('prompt-stats');

    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(statsRef);
      const data = doc.exists ? doc.data() ?? {} : {};

      const totalPrompts = ((data['totalPrompts'] as number) ?? 0) + 1;
      const bestPromptScore = Math.max(
        (data['bestPromptScore'] as number) ?? 0,
        params.promptScore ?? 0,
      );
      const promptsWithContext =
        ((data['promptsWithContext'] as number) ?? 0) +
        (params.hasContext ? 1 : 0);
      const activityTypes = new Set<string>(
        (data['activityTypes'] as string[]) ?? [],
      );
      if (params.activityType) {
        activityTypes.add(params.activityType);
      }

      tx.set(statsRef, {
        totalPrompts,
        bestPromptScore,
        promptsWithContext,
        activityTypes: Array.from(activityTypes),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  /**
   * Update project statistics for badge evaluation.
   * Tracks project creation, code generation, and code updates.
   *
   * @param userId - User UID
   * @param params - Project event parameters
   */
  async recordProjectStats(
    userId: string,
    params: {
      action: 'created' | 'generated' | 'updated';
    },
  ): Promise<void> {
    const statsRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('project-stats');

    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(statsRef);
      const data = doc.exists ? doc.data() ?? {} : {};

      const totalProjectsCreated =
        ((data['totalProjectsCreated'] as number) ?? 0) +
        (params.action === 'created' ? 1 : 0);
      const totalCodeGenerations =
        ((data['totalCodeGenerations'] as number) ?? 0) +
        (params.action === 'generated' ? 1 : 0);
      const totalProjectUpdates =
        ((data['totalProjectUpdates'] as number) ?? 0) +
        (params.action === 'updated' ? 1 : 0);

      tx.set(statsRef, {
        totalProjectsCreated,
        totalCodeGenerations,
        totalProjectUpdates,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  /**
   * Update agent statistics for badge evaluation.
   * Tracks agent creation, chat count, and persona customisations.
   *
   * @param userId - User UID
   * @param params - Agent event parameters
   */
  async recordAgentStats(
    userId: string,
    params: {
      action: 'created' | 'chatted' | 'customized';
    },
  ): Promise<void> {
    const statsRef = this.firebase.firestore
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('agent-stats');

    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(statsRef);
      const data = doc.exists ? doc.data() ?? {} : {};

      const totalAgentsCreated =
        ((data['totalAgentsCreated'] as number) ?? 0) +
        (params.action === 'created' ? 1 : 0);
      const totalAgentChats =
        ((data['totalAgentChats'] as number) ?? 0) +
        (params.action === 'chatted' ? 1 : 0);
      const agentPersonaCustomizations =
        ((data['agentPersonaCustomizations'] as number) ?? 0) +
        (params.action === 'customized' ? 1 : 0);

      tx.set(statsRef, {
        totalAgentsCreated,
        totalAgentChats,
        agentPersonaCustomizations,
        updatedAt: new Date().toISOString(),
      });
    });
  }
}
