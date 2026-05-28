import { Module } from '@nestjs/common';
import { CoppaController } from './coppa.controller';
import { CoppaService } from './coppa.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UsersModule, EmailModule],
  controllers: [CoppaController],
  providers: [CoppaService],
  exports: [CoppaService],
})
export class CoppaModule {}
