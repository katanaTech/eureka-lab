import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/** Health check module — provides GET /api/v1/health */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
