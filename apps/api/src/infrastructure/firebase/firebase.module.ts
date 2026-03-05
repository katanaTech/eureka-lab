import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Global Firebase module — provides Firebase Admin SDK services.
 * Registered globally so all modules can inject FirebaseService.
 */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
