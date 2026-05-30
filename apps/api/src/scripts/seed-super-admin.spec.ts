import { seedSuperAdmin } from './seed-super-admin';

describe('seedSuperAdmin', () => {
  const setClaims = jest.fn().mockResolvedValue(undefined);
  const docSet = jest.fn().mockResolvedValue(undefined);
  const firestore = {
    collection: jest.fn().mockReturnValue({ doc: jest.fn().mockReturnValue({ set: docSet }) }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('elevates an existing user to super_admin (idempotent merge)', async () => {
    const auth = {
      getUserByEmail: jest.fn().mockResolvedValue({ uid: 'u-1' }),
      createUser: jest.fn(),
      setCustomUserClaims: setClaims,
    };
    const uid = await seedSuperAdmin(auth as never, firestore as never, 'boss@eureka.dev');
    expect(uid).toBe('u-1');
    expect(auth.createUser).not.toHaveBeenCalled();
    expect(setClaims).toHaveBeenCalledWith('u-1', { role: 'super_admin' });
    expect(docSet).toHaveBeenCalledTimes(1);
    expect(docSet.mock.calls[0][0]).toMatchObject({ uid: 'u-1', role: 'super_admin' });
    expect(docSet.mock.calls[0][1]).toEqual({ merge: true });
  });

  it('creates the user when not found, then elevates', async () => {
    const auth = {
      getUserByEmail: jest.fn().mockRejectedValue({ code: 'auth/user-not-found' }),
      createUser: jest.fn().mockResolvedValue({ uid: 'u-2' }),
      setCustomUserClaims: setClaims,
    };
    const uid = await seedSuperAdmin(auth as never, firestore as never, 'new@eureka.dev', 'TempPass1');
    expect(uid).toBe('u-2');
    expect(auth.createUser).toHaveBeenCalledTimes(1);
    expect(setClaims).toHaveBeenCalledWith('u-2', { role: 'super_admin' });
  });
});
