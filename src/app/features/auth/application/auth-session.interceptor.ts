import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '@core/http/config/api.config';
import { isApiEndpoint, isApiRequest } from '@core/http/utils/api-request';
import { AuthSessionStore } from './auth-session.store';

export const authSessionInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (!isApiRequest(request.url, apiBaseUrl)) {
    return next(request);
  }

  const sessionStore = inject(AuthSessionStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        sessionStore.clear();

        if (
          !isApiEndpoint(request.url, apiBaseUrl, '/auth/login') &&
          !isApiEndpoint(request.url, apiBaseUrl, '/me')
        ) {
          void router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url },
          });
        }
      }

      return throwError(() => error);
    }),
  );
};
