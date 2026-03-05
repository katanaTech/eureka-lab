import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { ModuleStatus, PlanType } from '@eureka-lab/shared-types';
import { findModuleById, ALL_MODULES } from '../modules/module-data';
import type { ModuleDefinition } from '../modules/module-data';

/** Progress record stored in Firestore */
export interface ProgressRecord {
  /** User UID */
  userId: string;
  /** Module ID */
  moduleId: string;
  /** Index of the current activity */
  currentActivity: number;
  /** Indices of completed activities */
  completedActivities: number[];
  /** Average score for the module */
  score: number;
  /** Whether the module is fully completed */
  completed: boolean;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/** Module with resolved status for a specific user */
export interface UserModuleView {
  /** Module ID */
  id: string;
  /** Learning level */
  level: number;
  /** Module title */
  title: string;
  /** Module description */
  description: string;
  /** Estimated minutes */
  estimatedMinutes: number;
  /** Resolved status for this user */
  status: ModuleStatus;
  /** Plan required */
  requiredPlan: PlanType;
  /** XP reward */
  xpReward: number;
}

/** Result from completing an activity */
export interface ActivityCompletionResult {
  /** XP awarded */
  xpAwarded: number;
  /** Whether the entire module is now complete */
  moduleCompleted: boolean;
  /** ID of the next module to unlock */
  nextModuleId?: string;
}

/**
 * Service for tracking module progress per user.
 * Uses Firestore collection: progress/{userId}_{moduleId}
 * CLAUDE.md Rule 3: All Firestore queries include userId filter.
 */
@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);
  private readonly collectionName = 'progress';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Build a document ID for a progress record.
   * @param userId - User UID
   * @param moduleId - Module ID
   * @returns Composite document ID
   */
  private docId(userId: string, moduleId: string): string {
    return `${userId}_${moduleId}`;
  }

  /**
   * Get progress for a specific module.
   *
   * @param userId - User UID
   * @param moduleId - Module ID
   * @returns Progress record or null
   */
  async getProgress(
    userId: string,
    moduleId: string,
  ): Promise<ProgressRecord | null> {
    const doc = await this.firebase.firestore
      .collection(this.collectionName)
      .doc(this.docId(userId, moduleId))
      .get();

    if (!doc.exists) return null;
    return doc.data() as ProgressRecord;
  }

  /**
   * Get all progress records for a user.
   *
   * @param userId - User UID
   * @returns Map of moduleId → ProgressRecord
   */
  async getAllProgress(
    userId: string,
  ): Promise<Map<string, ProgressRecord>> {
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .get();

    const map = new Map<string, ProgressRecord>();
    for (const doc of snapshot.docs) {
      const data = doc.data() as ProgressRecord;
      map.set(data.moduleId, data);
    }
    return map;
  }

  /**
   * Get the list of modules with resolved status for a user.
   * Determines status based on progress records and plan.
   *
   * @param userId - User UID
   * @param userPlan - User's subscription plan
   * @param levelFilter - Optional level filter
   * @returns Array of modules with resolved status
   */
  async getModulesForUser(
    userId: string,
    userPlan: PlanType,
    levelFilter?: number,
  ): Promise<UserModuleView[]> {
    const progressMap = await this.getAllProgress(userId);
    let modules = ALL_MODULES;

    if (levelFilter) {
      modules = modules.filter((m) => m.level === levelFilter);
    }

    return modules.map((mod) => {
      /* Use global index in ALL_MODULES for cross-level progression */
      const globalIndex = ALL_MODULES.findIndex((m) => m.id === mod.id);
      return {
        id: mod.id,
        level: mod.level,
        title: mod.title,
        description: mod.description,
        estimatedMinutes: mod.estimatedMinutes,
        status: this.resolveStatus(mod, globalIndex, progressMap, userPlan),
        requiredPlan: mod.requiredPlan,
        xpReward: mod.xpReward,
      };
    });
  }

  /**
   * Complete an activity within a module.
   *
   * @param userId - User UID
   * @param moduleId - Module ID
   * @param activityIndex - Activity index within the module
   * @param score - Optional score (0–1)
   * @returns Completion result
   */
  async completeActivity(
    userId: string,
    moduleId: string,
    activityIndex: number,
    score?: number,
  ): Promise<ActivityCompletionResult> {
    const moduleDef = findModuleById(moduleId);
    if (!moduleDef) {
      throw new NotFoundException(`Module ${moduleId} not found`);
    }

    if (activityIndex < 0 || activityIndex >= moduleDef.activities.length) {
      throw new NotFoundException(
        `Activity index ${activityIndex} is out of range for module ${moduleId}`,
      );
    }

    const docRef = this.firebase.firestore
      .collection(this.collectionName)
      .doc(this.docId(userId, moduleId));

    const existing = await docRef.get();
    let record: ProgressRecord;

    if (existing.exists) {
      record = existing.data() as ProgressRecord;
    } else {
      record = {
        userId,
        moduleId,
        currentActivity: 0,
        completedActivities: [],
        score: 0,
        completed: false,
        updatedAt: new Date().toISOString(),
      };
    }

    /* Add activity to completed list if not already there */
    if (!record.completedActivities.includes(activityIndex)) {
      record.completedActivities.push(activityIndex);
    }

    /* Update current activity pointer */
    record.currentActivity = Math.max(
      record.currentActivity,
      activityIndex + 1,
    );

    /* Update score if provided */
    if (score !== undefined) {
      const totalScores = record.completedActivities.length;
      record.score =
        (record.score * (totalScores - 1) + score) / totalScores;
    }

    /* Check if module is complete */
    const moduleCompleted =
      record.completedActivities.length >= moduleDef.activities.length;
    record.completed = moduleCompleted;
    record.updatedAt = new Date().toISOString();

    await docRef.set(record);

    /* Calculate XP awarded */
    const activity = moduleDef.activities[activityIndex];
    const xpAwarded = activity.xpReward;

    /* Update user XP in the users collection */
    await this.addUserXp(userId, xpAwarded);

    /* Find next module */
    const nextModuleId = moduleCompleted
      ? this.getNextModuleId(moduleId)
      : undefined;

    this.logger.log({
      event: 'activity_completed',
      userId,
      moduleId,
      activityIndex,
      xpAwarded,
      moduleCompleted,
    });

    return { xpAwarded, moduleCompleted, nextModuleId };
  }

  /**
   * Add XP to a user's total.
   *
   * @param userId - User UID
   * @param xp - XP to add
   */
  private async addUserXp(userId: string, xp: number): Promise<void> {
    const userRef = this.firebase.firestore.collection('users').doc(userId);
    await this.firebase.firestore.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      if (doc.exists) {
        const currentXp = (doc.data()?.['xp'] as number) ?? 0;
        tx.update(userRef, { xp: currentXp + xp });
      }
    });
  }

  /**
   * Get the ID of the next module in sequence.
   *
   * @param currentModuleId - Current module ID
   * @returns Next module ID or undefined
   */
  private getNextModuleId(currentModuleId: string): string | undefined {
    const index = ALL_MODULES.findIndex((m) => m.id === currentModuleId);
    if (index >= 0 && index < ALL_MODULES.length - 1) {
      return ALL_MODULES[index + 1].id;
    }
    return undefined;
  }

  /**
   * Resolve the display status for a module.
   *
   * @param mod - Module definition
   * @param index - Index in the modules array
   * @param progressMap - User's progress records
   * @param userPlan - User's plan
   * @returns Resolved module status
   */
  private resolveStatus(
    mod: ModuleDefinition,
    index: number,
    progressMap: Map<string, ProgressRecord>,
    userPlan: PlanType,
  ): ModuleStatus {
    /* Check plan requirements */
    const planLevels: Record<PlanType, number> = {
      free: 0,
      explorer: 1,
      creator: 2,
    };
    if (planLevels[mod.requiredPlan] > planLevels[userPlan]) {
      return 'locked';
    }

    const progress = progressMap.get(mod.id);

    /* If completed */
    if (progress?.completed) return 'completed';

    /* If has progress */
    if (progress && progress.completedActivities.length > 0) {
      return 'in_progress';
    }

    /* First module is always available */
    if (index === 0) return 'available';

    /* Available if previous module (in global sequence) is completed */
    const prevModule = ALL_MODULES[index - 1];
    if (!prevModule) return 'locked';
    const prevProgress = progressMap.get(prevModule.id);
    if (prevProgress?.completed) return 'available';

    return 'locked';
  }
}
