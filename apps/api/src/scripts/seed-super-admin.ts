import { randomBytes } from 'crypto';
import type { auth as AdminAuth, firestore as AdminFirestore } from 'firebase-admin';

/**
 * Core seeding logic: ensure a Firebase user for `email` exists, elevate them
 * to `super_admin` via a custom claim, and upsert their Firestore user doc.
 * Idempotent — safe to re-run. Extracted from the CLI for testability.
 *
 * @param auth - Firebase Admin Auth instance.
 * @param firestore - Firebase Admin Firestore instance.
 * @param email - Email of the super-admin to seed.
 * @param password - Optional password used only when creating a new user.
 * @returns The seeded user's uid.
 */
export async function seedSuperAdmin(
  auth: AdminAuth.Auth,
  firestore: AdminFirestore.Firestore,
  email: string,
  password?: string,
): Promise<string> {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
  } catch {
    const created = await auth.createUser({
      email,
      password: password ?? randomBytes(12).toString('hex'),
      emailVerified: false,
    });
    uid = created.uid;
  }

  await auth.setCustomUserClaims(uid, { role: 'super_admin' });

  const now = Date.now();
  await firestore
    .collection('users')
    .doc(uid)
    .set(
      {
        uid,
        email,
        displayName: email.split('@')[0],
        role: 'super_admin',
        plan: 'free',
        xp: 0,
        streak: 0,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

  return uid;
}

/* istanbul ignore next -- CLI bootstrap, not unit-tested */
async function bootstrap(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: node dist/scripts/seed-super-admin.js <email>');
    process.exit(1);
  }
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../app.module');
  const { FirebaseService } = await import('../infrastructure/firebase/firebase.service');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const firebase = app.get(FirebaseService);
  const uid = await seedSuperAdmin(firebase.auth, firebase.firestore, email);
  // eslint-disable-next-line no-console
  console.log(`Seeded super_admin uid=${uid} email=${email}`);
  await app.close();
}

/* istanbul ignore next */
if (require.main === module) {
  bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
