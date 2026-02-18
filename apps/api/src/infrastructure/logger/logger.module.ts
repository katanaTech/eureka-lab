import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Global logger module — available to all modules without explicit import.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
