import { ConfigService } from '@nestjs/config';
import { AiGatewayService } from './ai-gateway.service';

describe('AiGatewayService', () => {
  let service: AiGatewayService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined), /* No API key — mock mode */
    } as unknown as ConfigService;

    service = new AiGatewayService(configService);
  });

  describe('buildSystemPrompt', () => {
    it('should include the safety preamble for Level 1', () => {
      const prompt = service.buildSystemPrompt(1);
      expect(prompt).toContain('MANDATORY SAFETY RULES');
      expect(prompt).toContain('LEVEL 1');
    });

    it('should include level-specific instructions for Level 3', () => {
      const prompt = service.buildSystemPrompt(3);
      expect(prompt).toContain('LEVEL 3');
      expect(prompt).toContain('sandboxed');
    });
  });

  describe('getTokenBudget', () => {
    it('should return 500 for Level 1', () => {
      expect(service.getTokenBudget(1)).toBe(500);
    });

    it('should return 1500 for Level 3', () => {
      expect(service.getTokenBudget(3)).toBe(1500);
    });
  });

  describe('scorePrompt', () => {
    it('should give a low score to short vague prompts', () => {
      const score = service.scorePrompt('tell me stuff');
      expect(score).toBeLessThan(0.3);
    });

    it('should give a higher score to specific prompts', () => {
      const score = service.scorePrompt(
        'Explain how photosynthesis works in simple terms for a 10-year-old.',
      );
      expect(score).toBeGreaterThan(0.3);
    });

    it('should give bonus for context', () => {
      const withoutContext = service.scorePrompt('How does photosynthesis work?');
      const withContext = service.scorePrompt(
        'How does photosynthesis work?',
        'I am a 12-year-old student studying biology for a school project.',
      );
      expect(withContext).toBeGreaterThan(withoutContext);
    });

    it('should score between 0 and 1', () => {
      const score = service.scorePrompt('a');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('streamResponse (mock mode)', () => {
    it('should yield tokens and a done chunk', async () => {
      const chunks: Array<{ type: string }> = [];

      for await (const chunk of service.streamResponse({
        prompt: 'What is AI?',
        level: 1,
        moduleId: 'l1-m1-what-is-a-prompt',
        userId: 'test-user',
      })) {
        chunks.push(chunk);
      }

      const tokenChunks = chunks.filter((c) => c.type === 'token');
      const doneChunks = chunks.filter((c) => c.type === 'done');

      expect(tokenChunks.length).toBeGreaterThan(0);
      expect(doneChunks).toHaveLength(1);
    });
  });
});
