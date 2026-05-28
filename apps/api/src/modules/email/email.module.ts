import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Global-ish email module. Exposes EmailService for any feature module
 * that needs to send transactional email (COPPA, magic-link signin, etc.).
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
