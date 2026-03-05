import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushService } from './push.service';
import { NotificationsService } from './notifications.service';
import * as webPush from 'web-push';
import type { DeviceRegistration, PushNotificationPayload } from '@eureka-lab/shared-types';

/** Mock web-push module */
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('PushService', () => {
  let service: PushService;

  const mockConfigService = {
    get: jest.fn((key: string): string | undefined => {
      const config: Record<string, string> = {
        VAPID_PUBLIC_KEY: 'test-public-key',
        VAPID_PRIVATE_KEY: 'test-private-key',
        VAPID_SUBJECT: 'mailto:test@eurekalab.app',
      };
      return config[key];
    }),
  };

  const mockNotificationsService = {
    getUserDevices: jest.fn(),
    removeExpiredDevice: jest.fn(),
  };

  /** Test device fixture */
  const testDevice: DeviceRegistration = {
    id: 'dev-1',
    endpoint: 'https://push.example.com/sub/123',
    keys: { p256dh: 'test-p256dh-key', auth: 'test-auth-key' },
    platform: 'web',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActiveAt: '2026-01-01T00:00:00.000Z',
  };

  /** Test notification payload */
  const testPayload: PushNotificationPayload = {
    type: 'streak_reminder',
    title: 'Keep your streak going!',
    body: 'You have a 7-day streak. Don\'t forget to learn today!',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    /* Reset mockConfigService to default implementation */
    mockConfigService.get.mockImplementation((key: string): string | undefined => {
      const config: Record<string, string> = {
        VAPID_PUBLIC_KEY: 'test-public-key',
        VAPID_PRIVATE_KEY: 'test-private-key',
        VAPID_SUBJECT: 'mailto:test@eurekalab.app',
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  describe('onModuleInit', () => {
    it('should configure VAPID details when keys are available', () => {
      service.onModuleInit();

      expect(webPush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:test@eurekalab.app',
        'test-public-key',
        'test-private-key',
      );
    });

    it('should not configure VAPID when keys are missing', () => {
      mockConfigService.get.mockReturnValue(undefined);

      service.onModuleInit();

      expect(webPush.setVapidDetails).not.toHaveBeenCalled();
    });

    it('should use default subject when VAPID_SUBJECT is not set', () => {
      mockConfigService.get.mockImplementation((key: string): string | undefined => {
        if (key === 'VAPID_PUBLIC_KEY') return 'pub-key';
        if (key === 'VAPID_PRIVATE_KEY') return 'priv-key';
        if (key === 'VAPID_SUBJECT') return undefined;
        return undefined;
      });

      service.onModuleInit();

      expect(webPush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:admin@eurekalab.app',
        'pub-key',
        'priv-key',
      );
    });
  });

  describe('getVapidPublicKey', () => {
    it('should return VAPID public key from config', () => {
      const key = service.getVapidPublicKey();

      expect(key).toBe('test-public-key');
    });

    it('should return null when key is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const key = service.getVapidPublicKey();

      expect(key).toBeNull();
    });
  });

  describe('sendToUser', () => {
    beforeEach(() => {
      /* Ensure VAPID is configured */
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          VAPID_PUBLIC_KEY: 'test-public-key',
          VAPID_PRIVATE_KEY: 'test-private-key',
          VAPID_SUBJECT: 'mailto:test@eurekalab.app',
        };
        return config[key];
      });
      service.onModuleInit();
    });

    it('should return 0 when VAPID is not configured', async () => {
      /* Reset with unconfigured service */
      mockConfigService.get.mockReturnValue(undefined);
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PushService,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      }).compile();
      const unconfiguredService = module.get<PushService>(PushService);
      unconfiguredService.onModuleInit();

      const result = await unconfiguredService.sendToUser('user-123', testPayload);

      expect(result).toBe(0);
    });

    it('should return 0 when user has no devices', async () => {
      mockNotificationsService.getUserDevices.mockResolvedValue([]);

      const result = await service.sendToUser('user-123', testPayload);

      expect(result).toBe(0);
      expect(webPush.sendNotification).not.toHaveBeenCalled();
    });

    it('should send notification to all user devices', async () => {
      const device2: DeviceRegistration = {
        ...testDevice,
        id: 'dev-2',
        endpoint: 'https://push.example.com/sub/456',
      };

      mockNotificationsService.getUserDevices.mockResolvedValue([testDevice, device2]);
      (webPush.sendNotification as jest.Mock).mockResolvedValue({});

      const result = await service.sendToUser('user-123', testPayload);

      expect(result).toBe(2);
      expect(webPush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should pass correct subscription format to web-push', async () => {
      mockNotificationsService.getUserDevices.mockResolvedValue([testDevice]);
      (webPush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.sendToUser('user-123', testPayload);

      expect(webPush.sendNotification).toHaveBeenCalledWith(
        {
          endpoint: 'https://push.example.com/sub/123',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        },
        JSON.stringify(testPayload),
        {
          TTL: 3600,
          urgency: 'normal',
        },
      );
    });

    it('should remove expired devices on HTTP 410', async () => {
      mockNotificationsService.getUserDevices.mockResolvedValue([testDevice]);
      (webPush.sendNotification as jest.Mock).mockRejectedValue({
        statusCode: 410,
        body: 'Gone',
      });
      mockNotificationsService.removeExpiredDevice.mockResolvedValue(undefined);

      const result = await service.sendToUser('user-123', testPayload);

      expect(result).toBe(0);
      expect(mockNotificationsService.removeExpiredDevice).toHaveBeenCalledWith(
        'user-123',
        'https://push.example.com/sub/123',
      );
    });

    it('should remove not-found devices on HTTP 404', async () => {
      mockNotificationsService.getUserDevices.mockResolvedValue([testDevice]);
      (webPush.sendNotification as jest.Mock).mockRejectedValue({
        statusCode: 404,
        body: 'Not Found',
      });
      mockNotificationsService.removeExpiredDevice.mockResolvedValue(undefined);

      const result = await service.sendToUser('user-123', testPayload);

      expect(result).toBe(0);
      expect(mockNotificationsService.removeExpiredDevice).toHaveBeenCalledWith(
        'user-123',
        'https://push.example.com/sub/123',
      );
    });

    it('should log but not remove on other errors', async () => {
      mockNotificationsService.getUserDevices.mockResolvedValue([testDevice]);
      (webPush.sendNotification as jest.Mock).mockRejectedValue({
        statusCode: 500,
        body: 'Server Error',
      });

      const result = await service.sendToUser('user-123', testPayload);

      expect(result).toBe(0);
      expect(mockNotificationsService.removeExpiredDevice).not.toHaveBeenCalled();
    });

    it('should count successful and failed deliveries separately', async () => {
      const device2: DeviceRegistration = {
        ...testDevice,
        id: 'dev-2',
        endpoint: 'https://push.example.com/sub/456',
      };

      mockNotificationsService.getUserDevices.mockResolvedValue([testDevice, device2]);

      /* First device succeeds, second fails */
      (webPush.sendNotification as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce({ statusCode: 500, body: 'Error' });

      const result = await service.sendToUser('user-123', testPayload);

      expect(result).toBe(1);
    });
  });
});
