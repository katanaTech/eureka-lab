import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoppaService } from './coppa.service';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { UsersRepository } from '../users/users.repository';
import { EmailService } from '../email/email.service';

describe('CoppaService', () => {
  let service: CoppaService;
  let firestoreMock: {
    collection: jest.Mock;
    batch: jest.Mock;
  };
  let firebaseAuthMock: {
    getUserByEmail: jest.Mock;
    createUser: jest.Mock;
    setCustomUserClaims: jest.Mock;
    generatePasswordResetLink: jest.Mock;
  };
  let usersMock: { create: jest.Mock };
  let emailMock: { sendCoppaConfirmation: jest.Mock };

  /** Build a fresh Firestore-doc mock with `get`/`set`/`delete` jest mocks. */
  const buildDocMock = (data?: object) => {
    const ref = {
      get: jest.fn().mockResolvedValue({ exists: !!data, data: () => data }),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    return ref;
  };

  beforeEach(async () => {
    firebaseAuthMock = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      setCustomUserClaims: jest.fn(),
      generatePasswordResetLink: jest.fn().mockResolvedValue('https://reset.link/xyz'),
    };
    firestoreMock = {
      collection: jest.fn(),
      batch: jest.fn().mockReturnValue({
        set: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      }),
    };
    usersMock = { create: jest.fn().mockResolvedValue(undefined) };
    emailMock = { sendCoppaConfirmation: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoppaService,
        {
          provide: FirebaseService,
          useValue: {
            firestore: firestoreMock,
            auth: firebaseAuthMock,
          },
        },
        { provide: UsersRepository, useValue: usersMock },
        { provide: EmailService, useValue: emailMock },
      ],
    }).compile();

    service = module.get(CoppaService);
  });

  describe('createPendingChild', () => {
    const currentYear = new Date().getFullYear();
    const baseDto = (birthYear: number) => ({
      email: 'kid@realm.io',
      parentEmail: 'parent@realm.io',
      displayName: 'Spark',
      birthYear,
    });

    it('rejects age >= 13 with NOT_UNDER_13', async () => {
      await expect(service.createPendingChild(baseDto(currentYear - 13))).rejects.toMatchObject({
        response: { code: 'NOT_UNDER_13' },
      });
      expect(firebaseAuthMock.getUserByEmail).not.toHaveBeenCalled();
    });

    it('rejects when email already exists with EMAIL_ALREADY_EXISTS', async () => {
      firebaseAuthMock.getUserByEmail.mockResolvedValue({ uid: 'existing' });
      await expect(service.createPendingChild(baseDto(currentYear - 10))).rejects.toMatchObject({
        response: { code: 'EMAIL_ALREADY_EXISTS' },
      });
    });

    it('creates pending doc and sends email when valid', async () => {
      firebaseAuthMock.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
      const docMock = buildDocMock();
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });

      const result = await service.createPendingChild(baseDto(currentYear - 10));

      expect(result.token).toMatch(/^[a-f0-9]{32}$/);
      expect(docMock.set).toHaveBeenCalledTimes(1);
      expect(emailMock.sendCoppaConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          parentEmail: 'parent@realm.io',
          kidDisplayName: 'Spark',
        }),
      );
    });
  });

  describe('confirmParentEmail', () => {
    it('throws NotFound when token does not exist', async () => {
      const docMock = buildDocMock();
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });

      await expect(
        service.confirmParentEmail({ token: 'a'.repeat(32) }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects expired token with TOKEN_EXPIRED', async () => {
      const expired = new Date(Date.now() - 1000).toISOString();
      const docMock = buildDocMock({
        token: 'a'.repeat(32),
        email: 'kid@realm.io',
        parentEmail: 'parent@realm.io',
        displayName: 'Spark',
        birthYear: 2017,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: expired,
      });
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });

      await expect(
        service.confirmParentEmail({ token: 'a'.repeat(32) }),
      ).rejects.toMatchObject({ response: { code: 'TOKEN_EXPIRED' } });
    });

    it('creates Firebase user + Firestore profile + audit row on valid token', async () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const docMock = buildDocMock({
        token: 'a'.repeat(32),
        email: 'kid@realm.io',
        parentEmail: 'parent@realm.io',
        displayName: 'Spark',
        birthYear: 2017,
        createdAt: new Date().toISOString(),
        expiresAt: future,
      });
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });
      firebaseAuthMock.createUser.mockResolvedValue({ uid: 'new-uid' });

      const result = await service.confirmParentEmail({ token: 'a'.repeat(32) });
      expect(result.uid).toBe('new-uid');
      expect(firebaseAuthMock.setCustomUserClaims).toHaveBeenCalledWith('new-uid', { role: 'child' });
      expect(usersMock.create).toHaveBeenCalledWith(
        'new-uid',
        expect.objectContaining({ role: 'child', birthYear: 2017 }),
      );
      expect(firestoreMock.batch).toHaveBeenCalled();
    });

    it('is idempotent: on auth/email-already-exists, returns existing user without re-provisioning', async () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const docMock = buildDocMock({
        token: 'a'.repeat(32),
        email: 'kid@realm.io',
        parentEmail: 'parent@realm.io',
        displayName: 'Spark',
        birthYear: 2017,
        createdAt: new Date().toISOString(),
        expiresAt: future,
      });
      firestoreMock.collection.mockReturnValue({ doc: () => docMock });
      firebaseAuthMock.createUser.mockRejectedValue({ code: 'auth/email-already-exists' });
      firebaseAuthMock.getUserByEmail.mockResolvedValue({ uid: 'existing-uid' });

      const result = await service.confirmParentEmail({ token: 'a'.repeat(32) });
      expect(result.uid).toBe('existing-uid');
      // The winning call already provisioned + audited — this one must not.
      expect(firebaseAuthMock.setCustomUserClaims).not.toHaveBeenCalled();
      expect(usersMock.create).not.toHaveBeenCalled();
      expect(firestoreMock.batch).not.toHaveBeenCalled();
    });
  });
});
