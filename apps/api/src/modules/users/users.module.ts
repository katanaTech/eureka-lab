import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';

/**
 * Users module — provides the Firestore repository for user documents
 * and exposes the settings/character REST endpoints.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
