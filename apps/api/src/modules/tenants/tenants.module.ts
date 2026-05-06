import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { UiModeResolver } from './ui-mode-resolver.service';

/**
 * Tenants module — manages B2B tenant configuration and provides
 * the UiModeResolver service for cross-module consumption.
 *
 * Imports UsersModule to satisfy the UsersRepository dependency in UiModeResolver.
 */
@Module({
  imports: [UsersModule],
  controllers: [TenantsController],
  providers: [TenantsService, UiModeResolver],
  exports: [TenantsService, UiModeResolver],
})
export class TenantsModule {}
