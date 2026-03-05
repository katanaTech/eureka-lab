import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';

/**
 * Users module — provides the Firestore repository for user documents.
 */
@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
