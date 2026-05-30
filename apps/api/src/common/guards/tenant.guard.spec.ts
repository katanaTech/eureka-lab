import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/** Build a fake ExecutionContext carrying a user + route params. */
function ctx(user: AuthenticatedUser, params: Record<string, string>): ExecutionContext {
  const request = { user, params };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  const guard = new TenantGuard();

  it('allows super_admin regardless of schoolId', () => {
    const user = { uid: 'sa', email: '', role: 'super_admin' } as AuthenticatedUser;
    expect(guard.canActivate(ctx(user, { id: 'school-1' }))).toBe(true);
  });

  it('allows a school_admin accessing their own school', () => {
    const user = { uid: 'a', email: '', role: 'school_admin', schoolId: 'school-1' } as AuthenticatedUser;
    expect(guard.canActivate(ctx(user, { id: 'school-1' }))).toBe(true);
  });

  it('rejects a school_admin accessing another school', () => {
    const user = { uid: 'a', email: '', role: 'school_admin', schoolId: 'school-1' } as AuthenticatedUser;
    expect(() => guard.canActivate(ctx(user, { id: 'school-2' }))).toThrow(ForbiddenException);
  });

  it('rejects a user with no schoolId', () => {
    const user = { uid: 'a', email: '', role: 'school_admin' } as AuthenticatedUser;
    expect(() => guard.canActivate(ctx(user, { id: 'school-1' }))).toThrow(ForbiddenException);
  });
});
