import {
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '@features/auth/application/auth.service';
import { UserRole } from '@features/auth/domain/model/auth-user.model';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const allowedRoles = rolesFrom(route.data['roles']);
  const user = authService.user();

  if (user !== null) {
    return hasAllowedRole(user.role, allowedRoles) ? true : router.createUrlTree(['/home']);
  }

  return authService.restoreSession().pipe(
    map((restoredUser) =>
      restoredUser !== null && hasAllowedRole(restoredUser.role, allowedRoles)
        ? true
        : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } }),
    ),
    catchError(() => of(router.createUrlTree(['/home']))),
  );
};

function rolesFrom(value: unknown): readonly UserRole[] {
  return Array.isArray(value) ? value.filter(isUserRole) : [];
}

function hasAllowedRole(userRole: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'ADMIN' || value === 'OPERATOR' || value === 'CUSTOMER';
}
