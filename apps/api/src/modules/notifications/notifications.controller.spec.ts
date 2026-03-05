import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/** Mock the guards to allow all requests */
jest.mock('../../common/guards/firebase-auth.guard', () => ({
  FirebaseAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

jest.mock('../../common/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    registerDevice: jest.fn(),
    unregisterDevice: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  };

  /** Standard authenticated user fixture */
  const mockUser: AuthenticatedUser = {
    uid: 'user-123',
    email: 'child@test.com',
    role: 'child',
  };

  const mockParentUser: AuthenticatedUser = {
    uid: 'parent-1',
    email: 'parent@test.com',
    role: 'parent',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('POST /notifications/register', () => {
    it('should register a web push device', async () => {
      const device = {
        id: 'dev-abc',
        endpoint: 'https://push.example.com/sub/123',
        keys: { p256dh: 'key-p256dh', auth: 'key-auth' },
        platform: 'web',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastActiveAt: '2026-01-01T00:00:00.000Z',
      };
      mockNotificationsService.registerDevice.mockResolvedValue(device);

      const result = await controller.registerDevice(mockUser, {
        endpoint: 'https://push.example.com/sub/123',
        keys: { p256dh: 'key-p256dh', auth: 'key-auth' },
        platform: 'web',
      });

      expect(result).toEqual(device);
      expect(mockNotificationsService.registerDevice).toHaveBeenCalledWith(
        'user-123',
        'https://push.example.com/sub/123',
        { p256dh: 'key-p256dh', auth: 'key-auth' },
        'web',
      );
    });

    it('should pass correct userId from authenticated user', async () => {
      mockNotificationsService.registerDevice.mockResolvedValue({});

      await controller.registerDevice(mockParentUser, {
        endpoint: 'https://push.example.com/sub/456',
        keys: { p256dh: 'k', auth: 'a' },
        platform: 'web',
      });

      expect(mockNotificationsService.registerDevice).toHaveBeenCalledWith(
        'parent-1',
        expect.any(String),
        expect.any(Object),
        expect.any(String),
      );
    });
  });

  describe('DELETE /notifications/unregister', () => {
    it('should unregister a device by endpoint', async () => {
      mockNotificationsService.unregisterDevice.mockResolvedValue(undefined);

      const result = await controller.unregisterDevice(mockUser, {
        endpoint: 'https://push.example.com/sub/123',
      });

      expect(result).toEqual({ message: 'Device unregistered' });
      expect(mockNotificationsService.unregisterDevice).toHaveBeenCalledWith(
        'user-123',
        'https://push.example.com/sub/123',
      );
    });
  });

  describe('GET /notifications/preferences', () => {
    it('should return notification preferences for the user', async () => {
      const prefs = {
        notificationsEnabled: true,
        streakReminders: true,
        parentAlerts: false,
        newBadges: true,
        weeklyReport: false,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      };
      mockNotificationsService.getPreferences.mockResolvedValue(prefs);

      const result = await controller.getPreferences(mockUser);

      expect(result).toEqual(prefs);
      expect(mockNotificationsService.getPreferences).toHaveBeenCalledWith('user-123');
    });

    it('should return defaults for user with no saved preferences', async () => {
      const defaults = {
        notificationsEnabled: false,
        streakReminders: true,
        parentAlerts: true,
        newBadges: true,
        weeklyReport: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      };
      mockNotificationsService.getPreferences.mockResolvedValue(defaults);

      const result = await controller.getPreferences(mockParentUser);

      expect(result.notificationsEnabled).toBe(false);
      expect(result.quietHoursStart).toBe('21:00');
    });
  });

  describe('PUT /notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const updatedPrefs = {
        notificationsEnabled: true,
        streakReminders: false,
        parentAlerts: true,
        newBadges: true,
        weeklyReport: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      };
      mockNotificationsService.updatePreferences.mockResolvedValue(updatedPrefs);

      const result = await controller.updatePreferences(mockUser, {
        notificationsEnabled: true,
        streakReminders: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      });

      expect(result.notificationsEnabled).toBe(true);
      expect(result.streakReminders).toBe(false);
      expect(mockNotificationsService.updatePreferences).toHaveBeenCalledWith(
        'user-123',
        {
          notificationsEnabled: true,
          streakReminders: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '06:00',
        },
      );
    });

    it('should support partial updates', async () => {
      mockNotificationsService.updatePreferences.mockResolvedValue({
        notificationsEnabled: false,
        streakReminders: true,
        parentAlerts: true,
        newBadges: false,
        weeklyReport: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      });

      const result = await controller.updatePreferences(mockUser, {
        newBadges: false,
      });

      expect(result.newBadges).toBe(false);
      expect(mockNotificationsService.updatePreferences).toHaveBeenCalledWith(
        'user-123',
        { newBadges: false },
      );
    });
  });
});
