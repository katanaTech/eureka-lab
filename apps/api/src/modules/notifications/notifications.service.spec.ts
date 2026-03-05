import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  /** Firestore mock helpers */
  const mockSet = jest.fn().mockResolvedValue(undefined);
  const mockDelete = jest.fn().mockResolvedValue(undefined);
  const mockGet = jest.fn();
  const mockDocRef = jest.fn();
  const mockCollectionRef = jest.fn();

  const mockFirebaseService = {
    firestore: {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              set: mockSet,
              get: mockGet,
              delete: mockDelete,
            }),
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
          get: mockGet,
        }),
      }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('registerDevice', () => {
    it('should store device document with correct structure', async () => {
      const result = await service.registerDevice(
        'user-123',
        'https://push.example.com/sub/abc',
        { p256dh: 'key-p256dh', auth: 'key-auth' },
        'web',
      );

      expect(result).toMatchObject({
        endpoint: 'https://push.example.com/sub/abc',
        keys: { p256dh: 'key-p256dh', auth: 'key-auth' },
        platform: 'web',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.lastActiveAt).toBeDefined();
      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
        endpoint: 'https://push.example.com/sub/abc',
        platform: 'web',
      }));
    });

    it('should generate consistent device IDs from same endpoint', async () => {
      const result1 = await service.registerDevice(
        'user-123',
        'https://push.example.com/sub/abc',
        { p256dh: 'key1', auth: 'key1' },
        'web',
      );

      const result2 = await service.registerDevice(
        'user-123',
        'https://push.example.com/sub/abc',
        { p256dh: 'key2', auth: 'key2' },
        'web',
      );

      expect(result1.id).toBe(result2.id);
    });

    it('should generate different device IDs for different endpoints', async () => {
      const result1 = await service.registerDevice(
        'user-123',
        'https://push.example.com/sub/abc',
        { p256dh: 'key1', auth: 'key1' },
        'web',
      );

      const result2 = await service.registerDevice(
        'user-123',
        'https://push.example.com/sub/xyz',
        { p256dh: 'key2', auth: 'key2' },
        'web',
      );

      expect(result1.id).not.toBe(result2.id);
    });

    it('should support different platforms', async () => {
      const webDevice = await service.registerDevice(
        'user-123',
        'https://push.example.com/web',
        { p256dh: 'k1', auth: 'k1' },
        'web',
      );
      expect(webDevice.platform).toBe('web');

      const androidDevice = await service.registerDevice(
        'user-123',
        'https://push.example.com/android',
        { p256dh: 'k2', auth: 'k2' },
        'android',
      );
      expect(androidDevice.platform).toBe('android');
    });
  });

  describe('unregisterDevice', () => {
    it('should delete device document by endpoint hash', async () => {
      await service.unregisterDevice('user-123', 'https://push.example.com/sub/abc');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('getUserDevices', () => {
    it('should return empty array when no devices registered', async () => {
      const devicesCollectionMock = {
        get: jest.fn().mockResolvedValue({ docs: [] }),
      };

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue(devicesCollectionMock),
        }),
      });

      const devices = await service.getUserDevices('user-123');

      expect(devices).toEqual([]);
    });

    it('should return all registered devices for user', async () => {
      const mockDevices = [
        {
          data: () => ({
            id: 'dev-1',
            endpoint: 'https://push.example.com/1',
            keys: { p256dh: 'k1', auth: 'a1' },
            platform: 'web',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastActiveAt: '2026-01-01T00:00:00.000Z',
          }),
        },
        {
          data: () => ({
            id: 'dev-2',
            endpoint: 'https://push.example.com/2',
            keys: { p256dh: 'k2', auth: 'a2' },
            platform: 'android',
            createdAt: '2026-01-02T00:00:00.000Z',
            lastActiveAt: '2026-01-02T00:00:00.000Z',
          }),
        },
      ];

      const devicesCollectionMock = {
        get: jest.fn().mockResolvedValue({ docs: mockDevices }),
      };

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue(devicesCollectionMock),
        }),
      });

      const devices = await service.getUserDevices('user-123');

      expect(devices).toHaveLength(2);
      expect(devices[0].platform).toBe('web');
      expect(devices[1].platform).toBe('android');
    });
  });

  describe('getPreferences', () => {
    it('should return defaults when no preferences doc exists', async () => {
      const prefsDocMock = {
        get: jest.fn().mockResolvedValue({ exists: false }),
      };

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue(prefsDocMock),
          }),
        }),
      });

      const prefs = await service.getPreferences('user-123');

      expect(prefs.notificationsEnabled).toBe(false);
      expect(prefs.streakReminders).toBe(true);
      expect(prefs.parentAlerts).toBe(true);
      expect(prefs.newBadges).toBe(true);
      expect(prefs.weeklyReport).toBe(true);
      expect(prefs.quietHoursStart).toBe('21:00');
      expect(prefs.quietHoursEnd).toBe('07:00');
    });

    it('should return stored preferences when doc exists', async () => {
      const storedPrefs = {
        notificationsEnabled: true,
        streakReminders: false,
        parentAlerts: true,
        newBadges: false,
        weeklyReport: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '06:00',
      };

      const prefsDocMock = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => storedPrefs,
        }),
      };

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue(prefsDocMock),
          }),
        }),
      });

      const prefs = await service.getPreferences('user-123');

      expect(prefs.notificationsEnabled).toBe(true);
      expect(prefs.streakReminders).toBe(false);
      expect(prefs.quietHoursStart).toBe('22:00');
    });
  });

  describe('updatePreferences', () => {
    it('should merge partial updates with existing preferences', async () => {
      const prefsRef = {
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({
          data: () => ({
            notificationsEnabled: true,
            streakReminders: false,
          }),
        }),
      };

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue(prefsRef),
          }),
        }),
      });

      const result = await service.updatePreferences('user-123', {
        streakReminders: false,
      });

      expect(prefsRef.set).toHaveBeenCalledWith(
        { streakReminders: false },
        { merge: true },
      );
      expect(result).toBeDefined();
    });
  });

  describe('removeExpiredDevice', () => {
    it('should delete expired device by endpoint', async () => {
      const deleteForExpired = jest.fn().mockResolvedValue(undefined);

      mockFirebaseService.firestore.collection = jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              delete: deleteForExpired,
            }),
          }),
        }),
      });

      await service.removeExpiredDevice('user-123', 'https://push.example.com/sub/expired');

      expect(deleteForExpired).toHaveBeenCalled();
    });
  });
});
