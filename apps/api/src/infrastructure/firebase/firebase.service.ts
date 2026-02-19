import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';
import { LoggerService } from '../logger/logger.service';

/**
 * Firebase Admin SDK service.
 * Provides access to Firestore, Auth, and Storage.
 * Initialises the Admin SDK once at module bootstrap.
 *
 * Security rules enforced here:
 * - Uses Firebase Admin SDK (never client SDK on backend)
 * - Service account credentials read exclusively from env vars (never hardcoded)
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Initialises Firebase Admin SDK using service account credentials from env vars.
   * Skips initialisation if an app instance already exists (idempotent).
   * Called automatically by NestJS at module bootstrap.
   * @returns void
   */
  onModuleInit(): void {
    // Guard: only initialise once across hot-reloads and test runs
    if (admin.apps.length > 0) {
      this.app = admin.apps[0] as admin.app.App;
      this.logger.log(
        { event: 'firebase_admin_reused', appName: this.app.name },
        FirebaseService.name,
      );
      return;
    }

    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');

    // Support both base64-encoded key (Railway-safe) and raw PEM key
    const privateKeyBase64 = this.config.get<string>('FIREBASE_PRIVATE_KEY_BASE64');
    const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    let privateKey: string;
    if (privateKeyBase64) {
      privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
    } else if (privateKeyRaw) {
      // Replace escaped newlines from environment variable interpolation
      privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    } else {
      throw new Error(
        'Firebase private key missing: set FIREBASE_PRIVATE_KEY_BASE64 or FIREBASE_PRIVATE_KEY',
      );
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    this.logger.log(
      { event: 'firebase_admin_initialised', projectId },
      FirebaseService.name,
    );
  }

  /**
   * Returns the Firestore database instance.
   * All queries MUST include a `userId` filter (CLAUDE.md Security Rule 3).
   * @returns Firestore — the Firestore Admin SDK instance
   */
  getFirestore(): Firestore {
    return this.app.firestore();
  }

  /**
   * Returns the Firebase Auth instance.
   * Used for verifying ID tokens and managing users server-side.
   * @returns Auth — the Firebase Admin Auth instance
   */
  getAuth(): Auth {
    return this.app.auth();
  }

  /**
   * Returns the Firebase Cloud Storage instance.
   * Used for storing user-generated content (e.g. uploaded images).
   * @returns Storage — the Firebase Admin Storage instance
   */
  getStorage(): Storage {
    return this.app.storage();
  }
}
