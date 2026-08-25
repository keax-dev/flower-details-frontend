import { TestBed } from '@angular/core/testing';
import { AuthService } from '@features/auth/application/auth.service';
import { AuthUser, UserRole } from '@features/auth/domain/model/auth-user.model';
import { roleGuard } from '@features/auth/guards/role.guard';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';

const USER: AuthUser = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '0102030405',
  role: 'ADMIN',
};

async function executeGuard(
  user: AuthUser | null,
  restoredUser: AuthUser | null = null,
  roles: readonly UserRole[] = ['ADMIN'],
  restoreError = false,
) {
  const currentUser = signal(user);
  const authService = {
    user: currentUser.asReadonly(),
    restoreSession: vi.fn(() =>
      restoreError ? throwError(() => new Error('Offline')) : of(restoredUser),
    ),
  };
  const router = {
    createUrlTree: vi.fn((commands: unknown[], extras?: unknown) => ({ commands, extras })),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: Router, useValue: router },
    ],
  });

  const result = TestBed.runInInjectionContext(() =>
    roleGuard(
      { data: { roles } } as unknown as ActivatedRouteSnapshot,
      { url: '/admin/categories' } as RouterStateSnapshot,
    ),
  );

  return {
    authService,
    router,
    result: isObservable(result) ? await firstValueFrom(result) : result,
  };
}

describe('roleGuard', () => {
  it('allows a user who already has an authorized role', async () => {
    const { authService, result } = await executeGuard(USER);

    expect(result).toBe(true);
    expect(authService.restoreSession).not.toHaveBeenCalled();
  });

  it('redirects an authenticated user without permission to the home page', async () => {
    const { result, router } = await executeGuard({ ...USER, role: 'CUSTOMER' });

    expect(result).toEqual({ commands: ['/home'], extras: undefined });
    expect(router.createUrlTree).toHaveBeenCalledWith(['/home']);
  });

  it('restores an authorized session before allowing access', async () => {
    const { authService, result } = await executeGuard(null, USER);

    expect(result).toBe(true);
    expect(authService.restoreSession).toHaveBeenCalledOnce();
  });

  it('redirects an anonymous user to login with the original URL', async () => {
    const { result, router } = await executeGuard(null);

    expect(result).toEqual({
      commands: ['/auth/login'],
      extras: { queryParams: { returnUrl: '/admin/categories' } },
    });
    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/admin/categories' },
    });
  });

  it('redirects home when session restoration fails unexpectedly', async () => {
    const { result } = await executeGuard(null, null, ['ADMIN'], true);

    expect(result).toEqual({ commands: ['/home'], extras: undefined });
  });
});
