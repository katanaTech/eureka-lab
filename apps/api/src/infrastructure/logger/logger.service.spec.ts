import { Test, type TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('log() accepts a string message without throwing', () => {
    expect(() => service.log('test message')).not.toThrow();
  });

  it('log() accepts a structured object without throwing', () => {
    expect(() => service.log({ event: 'test', userId: 'abc' })).not.toThrow();
  });

  it('error() accepts a message and trace without throwing', () => {
    expect(() =>
      service.error('error occurred', 'Error\n  at line 1', 'TestContext'),
    ).not.toThrow();
  });

  it('warn() accepts a string without throwing', () => {
    expect(() => service.warn('warning message')).not.toThrow();
  });

  it('debug() accepts a string without throwing', () => {
    expect(() => service.debug('debug info')).not.toThrow();
  });
});
