import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';

const mockFirebaseAuth = {
  createUser: jest.fn(),
  setCustomUserClaims: jest.fn(),
  createCustomToken: jest.fn(),
  verifyIdToken: jest.fn(),
  revokeRefreshTokens: jest.fn(),
  getUser: jest.fn(),
  generateEmailVerificationLink: jest.fn(),
};

const mockFirebaseService = {
  auth: mockFirebaseAuth,
  firestore: {},
};

const mockUsersRepository = {
  findByUid: jest.fn(),
  create: jest.fn(),
  addChildToParent: jest.fn(),
  findChildrenByParent: jest.fn(),
  countChildrenByParent: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a parent account and return token', async () => {
      mockFirebaseAuth.createUser.mockResolvedValue({ uid: 'uid-123' });
      mockFirebaseAuth.setCustomUserClaims.mockResolvedValue(undefined);
      mockFirebaseAuth.createCustomToken.mockResolvedValue('mock-token');
      mockUsersRepository.create.mockResolvedValue({});

      const result = await service.signup({
        email: 'parent@test.com',
        password: 'SecurePass1',
        displayName: 'Test Parent',
        role: 'parent',
      });

      expect(result.uid).toBe('uid-123');
      expect(result.role).toBe('parent');
      expect(result.token).toBe('mock-token');
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith('uid-123', {
        role: 'parent',
      });
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockFirebaseAuth.createUser.mockRejectedValue(
        new Error('The user with the provided email already exists (auth/email-already-exists).'),
      );

      await expect(
        service.signup({
          email: 'existing@test.com',
          password: 'SecurePass1',
          displayName: 'Test',
          role: 'parent',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return enriched profile on valid token', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'uid-123' });
      mockUsersRepository.findByUid.mockResolvedValue({
        uid: 'uid-123',
        email: 'parent@test.com',
        displayName: 'Test',
        role: 'parent',
        plan: 'free',
        xp: 100,
      });
      mockUsersRepository.findChildrenByParent.mockResolvedValue([]);

      const result = await service.login('valid-token');
      expect(result.uid).toBe('uid-123');
      expect(result.plan).toBe('free');
      expect(result.children).toEqual([]);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockFirebaseAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.login('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('addChild', () => {
    const currentYear = new Date().getFullYear();

    it('should create a child account for valid age', async () => {
      mockUsersRepository.countChildrenByParent.mockResolvedValue(0);
      mockFirebaseAuth.createUser.mockResolvedValue({ uid: 'child-uid' });
      mockFirebaseAuth.setCustomUserClaims.mockResolvedValue(undefined);
      mockUsersRepository.create.mockResolvedValue({});
      mockUsersRepository.addChildToParent.mockResolvedValue(undefined);

      const result = await service.addChild('parent-uid', {
        displayName: 'Alex',
        birthYear: currentYear - 10,
      });

      expect(result.uid).toBe('child-uid');
      expect(result.age).toBe(10);
      expect(result.role).toBe('child');
      expect(result.plan).toBe('free');
    });

    it('should reject child under 8', async () => {
      await expect(
        service.addChild('parent-uid', {
          displayName: 'Baby',
          birthYear: currentYear - 5,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject child over 16', async () => {
      await expect(
        service.addChild('parent-uid', {
          displayName: 'Adult',
          birthYear: currentYear - 20,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if parent has 5 children already', async () => {
      mockUsersRepository.countChildrenByParent.mockResolvedValue(5);

      await expect(
        service.addChild('parent-uid', {
          displayName: 'Kid',
          birthYear: currentYear - 10,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
