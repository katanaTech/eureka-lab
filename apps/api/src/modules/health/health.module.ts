import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health check module.
 * Provides the GET /health endpoint for Railway uptime monitoring.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
