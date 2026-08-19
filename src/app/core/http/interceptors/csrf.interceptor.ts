import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { isApiEndpoint, isApiRequest } from '@core/http/utils/api-request';
import { API_BASE_URL } from '@core/http/config/api.config';
import { CsrfService } from '@core/http/security/csrf.service';
import { inject } from '@angular/core';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const csrfInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (
    !isApiRequest(request.url, apiBaseUrl) ||
    !MUTATING_METHODS.has(request.method.toUpperCase()) ||
    isCsrfEndpoint(request.url, apiBaseUrl) ||
    isSessionEndpoint(request.url, apiBaseUrl)
  ) {
    return next(request);
  }

  const csrfService = inject(CsrfService);

  return csrfService.token().pipe(
    switchMap((csrfToken) => next(withCsrfToken(request, csrfToken))),
    catchError((error: unknown) => {
      if (!isInvalidCsrfError(error)) {
        return throwError(() => error);
      }

      return csrfService
        .refreshToken()
        .pipe(switchMap((csrfToken) => next(withCsrfToken(request, csrfToken))));
    }),
  );
};

function withCsrfToken(
  request: Parameters<HttpInterceptorFn>[0],
  csrfToken: {
    headerName: string;
    token: string;
  },
) {
  return request.clone({
    setHeaders: {
      [csrfToken.headerName]: csrfToken.token,
    },
  });
}

function isCsrfEndpoint(url: string, apiBaseUrl: string): boolean {
  return isApiEndpoint(url, apiBaseUrl, '/auth/csrf');
}

function isSessionEndpoint(url: string, apiBaseUrl: string): boolean {
  return (
    isApiEndpoint(url, apiBaseUrl, '/auth/login') ||
    isApiEndpoint(url, apiBaseUrl, '/auth/register')
  );
}

function isInvalidCsrfError(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 403 &&
    typeof error.error === 'object' &&
    error.error !== null &&
    'code' in error.error &&
    error.error.code === 'CSRF_TOKEN_INVALID'
  );
}
