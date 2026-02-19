import { Test, type TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';

/**
 * End-to-end smoke tests for the GET /health endpoint.
 *
 * Sprint 1 exit criteria: the health endpoint must return HTTP 200 with
 * a JSON body containing { status: 'ok', timestamp: <ISO8601>, version: string,
 * environment: string }.
 *
 * Uses Fastify's built-in `app.inject()` so no real TCP port is opened,
 * keeping tests fast and portable across environments.
 */
describe('GET /health (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Primary smoke test.
   * Verifies the endpoint is reachable, returns 200, and the body contains
   * the required { status: 'ok' } field with a valid ISO 8601 timestamp.
   */
  it('returns 200 with status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as {
      status: string;
      timestamp: string;
      version: string;
      environment: string;
    };
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  /**
   * Verifies that the endpoint responds with an application/json Content-Type
   * header so clients can safely parse the body.
   */
  it('returns JSON content type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.headers['content-type']).toContain('application/json');
  });

  /**
   * Verifies that unknown routes return 404.
   * Guards against accidental catch-all route registrations that would mask
   * routing bugs in future modules.
   */
  it('returns 404 for unknown routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/not-a-real-route',
    });

    expect(response.statusCode).toBe(404);
  });
});
