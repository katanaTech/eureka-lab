import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';

/**
 * Moderation module — child safety content filtering.
 * Exported so AiGatewayModule can inject ModerationService.
 *
 * Implementation: BE-021 (Layer 1) + BE-022 (Layer 2)
 * Tests: moderation.service.spec.ts (QA adversarial suite)
 */
@Module({
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
