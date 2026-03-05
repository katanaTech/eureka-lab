import { Controller, Get } from '@nestjs/common';

/** Health check controller for uptime monitoring and deployment verification. */
@Controller('health')
export class HealthController {
  /**
   * Returns a simple health status with timestamp.
   * @returns Health status object
   */
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
