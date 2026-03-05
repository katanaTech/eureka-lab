import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import type { ModerationCheckFlag } from './content-moderation.service';

/** Moderation log record stored in Firestore */
export interface ModerationLogRecord {
  /** Auto-generated doc ID */
  id: string;
  /** User who triggered the flag */
  userId: string;
  /** Module where the flag occurred */
  moduleId: string;
  /** The content that was flagged (truncated) */
  content: string;
  /** Whether this was input or output */
  direction: 'input' | 'output';
  /** Flags raised */
  flags: ModerationCheckFlag[];
  /** ISO timestamp */
  createdAt: string;
}

/**
 * Service for persisting moderation events to Firestore.
 * CLAUDE.md Rule 4: AI responses must pass moderation pipeline.
 * CLAUDE.md Rule 5: Child data requires schema validation.
 */
@Injectable()
export class ModerationLogService {
  private readonly logger = new Logger(ModerationLogService.name);
  private readonly collectionName = 'moderation-logs';
  private readonly maxContentLength = 500;

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Log a moderation event to Firestore.
   *
   * @param userId - User UID
   * @param moduleId - Module identifier
   * @param content - Flagged content (will be truncated)
   * @param direction - Whether input (user prompt) or output (AI response)
   * @param flags - Moderation flags raised
   */
  async logModerationEvent(
    userId: string,
    moduleId: string,
    content: string,
    direction: 'input' | 'output',
    flags: ModerationCheckFlag[],
  ): Promise<void> {
    try {
      const truncatedContent =
        content.length > this.maxContentLength
          ? `${content.slice(0, this.maxContentLength)}...`
          : content;

      const record: Omit<ModerationLogRecord, 'id'> = {
        userId,
        moduleId,
        content: truncatedContent,
        direction,
        flags,
        createdAt: new Date().toISOString(),
      };

      await this.firebase.firestore
        .collection(this.collectionName)
        .add(record);

      this.logger.log({
        event: 'moderation_logged',
        userId,
        moduleId,
        direction,
        flagCount: flags.length,
      });
    } catch (error: unknown) {
      /* Logging failures should not block the user experience */
      const message =
        error instanceof Error ? error.message : 'Moderation log failed';
      this.logger.error({ event: 'moderation_log_error', error: message });
    }
  }

  /**
   * Get moderation logs for a specific user (parent dashboard).
   *
   * @param userId - User UID
   * @param limit - Max records to return
   * @returns Array of moderation log records
   */
  async getLogsForUser(
    userId: string,
    limit = 20,
  ): Promise<ModerationLogRecord[]> {
    const snapshot = await this.firebase.firestore
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ModerationLogRecord, 'id'>),
    }));
  }
}
