import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

/**
 * Health check response shape.
 */
interface HealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
  environment: string;
}

/**
 * Health check controller.
 * Exposed at GET /health — NOT under the /api/v1 prefix.
 * Used by Railway for health checks (healthcheckPath = "/health" in railway.toml).
 *
 * No authentication required — uptime monitors must be able to reach this endpoint.
 */
@Controller('health')
export class HealthController {
  /**
   * Returns the current health status of the API.
   * A 200 response means the process is alive and running.
   *
   * @returns Health status object with timestamp and version
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '0.0.1',
      environment: process.env['NODE_ENV'] ?? 'development',
    };
  }
}
