import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK service.
 * Provides access to Firestore, Auth, and Storage.
 * CLAUDE.md Rule 18: All third-party SDKs go through an abstraction layer.
 *
 * Credentials priority:
 *  1. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (explicit env vars)
 *  2. GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 *  3. firebase-service-account.json in apps/api/ (convention)
 *  4. Default credentials (CI/Cloud environments)
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Firebase Admin SDK on module startup.
   * Tries multiple credential sources in order.
   */
  onModuleInit(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

    /* Option 1: Explicit env vars */
    if (projectId && clientEmail && privateKey && privateKey.includes('PRIVATE KEY')) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log({ event: 'firebase_init', projectId, status: 'connected_env' });
      return;
    }

    /* Option 2: GOOGLE_APPLICATION_CREDENTIALS env var */
    if (credentialsPath && existsSync(credentialsPath)) {
      const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as admin.ServiceAccount;
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log({ event: 'firebase_init', status: 'connected_json', path: credentialsPath });
      return;
    }

    /* Option 3: Convention — firebase-service-account.json in apps/api/ */
    const conventionPaths = [
      resolve(process.cwd(), 'firebase-service-account.json'),
      resolve(__dirname, '..', '..', '..', 'firebase-service-account.json'),
    ];
    for (const saPath of conventionPaths) {
      if (existsSync(saPath)) {
        const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8')) as admin.ServiceAccount;
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log({ event: 'firebase_init', status: 'connected_json', path: saPath });
        return;
      }
    }

    /* Option 4: Default credentials (GCP environments / emulator) */
    try {
      this.app = admin.initializeApp({ projectId: projectId || undefined });
      this.logger.warn({
        event: 'firebase_init',
        status: 'default_credentials',
        message:
          'No service account found. To fix: download your Firebase service account JSON from ' +
          'Firebase Console → Project Settings → Service accounts → Generate new private key, ' +
          'then save it as apps/api/firebase-service-account.json',
      });
    } catch (error: unknown) {
      this.logger.error({
        event: 'firebase_init',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /** @returns Firestore instance */
  get firestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  /** @returns Firebase Auth instance */
  get auth(): admin.auth.Auth {
    return this.app.auth();
  }

  /** @returns Firebase Storage bucket */
  get storage(): admin.storage.Storage {
    return this.app.storage();
  }
}
