import { Test, TestingModule } from '@nestjs/testing';
import { UiModeResolver } from './ui-mode-resolver.service';
import { UsersRepository } from '../users/users.repository';
import { TenantsService } from './tenants.service';
import type { TenantUiModeLock } from '@eureka-lab/shared-types';

// ── Mock helpers ──────────────────────────────────────────────────────────────

const mockUsersRepository = {
  getUiMode: jest.fn(),
};

const mockTenantsService = {
  getUiModeLock: jest.fn(),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('UiModeResolver', () => {
  let resolver: UiModeResolver;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UiModeResolver,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: TenantsService, useValue: mockTenantsService },
      ],
    }).compile();

    resolver = module.get<UiModeResolver>(UiModeResolver);
  });

  // ── Tenant lock (highest precedence) ──────────────────────────────────────

  describe('tenant lock precedence', () => {
    it('returns the tenant-locked mode when tenant lock is active', async () => {
      const lock: TenantUiModeLock = { mode: 'gamified', locked: true };
      mockTenantsService.getUiModeLock.mockResolvedValue(lock);
      mockUsersRepository.getUiMode.mockResolvedValue('normal');

      const result = await resolver.resolve('user-1', 'tenant-school');

      expect(result).toBe('gamified');
      // User preference should not be consulted when tenant lock applies
      expect(mockUsersRepository.getUiMode).not.toHaveBeenCalled();
    });

    it('ignores the tenant lock when locked is false', async () => {
      const lock: TenantUiModeLock = { mode: 'gamified', locked: false };
      mockTenantsService.getUiModeLock.mockResolvedValue(lock);
      mockUsersRepository.getUiMode.mockResolvedValue('normal');

      const result = await resolver.resolve('user-1', 'tenant-school');

      // Falls through to user preference
      expect(result).toBe('normal');
    });

    it('ignores the tenant lock when mode is null', async () => {
      const lock: TenantUiModeLock = { mode: null, locked: true };
      mockTenantsService.getUiModeLock.mockResolvedValue(lock);
      mockUsersRepository.getUiMode.mockResolvedValue('gamified');

      const result = await resolver.resolve('user-1', 'tenant-school');

      // mode is null, so falls through to user preference
      expect(result).toBe('gamified');
    });

    it('does not call tenantsService when tenantId is null', async () => {
      mockUsersRepository.getUiMode.mockResolvedValue('gamified');

      await resolver.resolve('user-1', null);

      expect(mockTenantsService.getUiModeLock).not.toHaveBeenCalled();
    });
  });

  // ── User preference (second precedence) ───────────────────────────────────

  describe('user preference precedence', () => {
    it('returns the user preference when no tenant lock is active', async () => {
      mockTenantsService.getUiModeLock.mockResolvedValue(null);
      mockUsersRepository.getUiMode.mockResolvedValue('gamified');

      const result = await resolver.resolve('user-1', 'tenant-school');

      expect(result).toBe('gamified');
    });

    it('returns the user preference when tenantId is null', async () => {
      mockUsersRepository.getUiMode.mockResolvedValue('gamified');

      const result = await resolver.resolve('user-1', null);

      expect(result).toBe('gamified');
    });
  });

  // ── Default fallback ───────────────────────────────────────────────────────

  describe('default fallback', () => {
    it('returns normal as default when no tenant and no user preference', async () => {
      mockUsersRepository.getUiMode.mockResolvedValue(null);

      const result = await resolver.resolve('user-1', null);

      expect(result).toBe('normal');
    });

    it('returns normal as default when tenant has no lock and user has no preference', async () => {
      mockTenantsService.getUiModeLock.mockResolvedValue(null);
      mockUsersRepository.getUiMode.mockResolvedValue(null);

      const result = await resolver.resolve('user-1', 'tenant-school');

      expect(result).toBe('normal');
    });
  });
});
