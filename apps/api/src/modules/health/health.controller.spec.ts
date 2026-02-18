import { Test, type TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('returns status "ok"', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
    });

    it('returns a valid ISO 8601 timestamp', () => {
      const result = controller.check();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('returns a version string', () => {
      const result = controller.check();
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
    });

    it('returns an environment string', () => {
      const result = controller.check();
      expect(typeof result.environment).toBe('string');
    });

    it('response matches expected shape', () => {
      const result = controller.check();
      expect(result).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String) as string,
        version: expect.any(String) as string,
        environment: expect.any(String) as string,
      });
    });
  });
});
