import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Global Firebase Admin SDK module.
 * Registers FirebaseService as a globally available provider.
 * Import this module once in AppModule — all other modules can inject
 * FirebaseService without importing FirebaseModule themselves.
 *
 * The SDK is initialised once at startup; subsequent calls are no-ops
 * (guarded by `admin.apps.length` check in FirebaseService.onModuleInit).
 */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
