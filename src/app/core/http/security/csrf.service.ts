import { catchError, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface CsrfTokenResponse {
  headerName: string;
  token: string;
}

@Service()
export class CsrfService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  private tokenRequest$?: Observable<CsrfTokenResponse>;

  initialize(): Observable<void> {
    return this.token().pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }

  token(): Observable<CsrfTokenResponse> {
    this.tokenRequest$ ??= this.httpClient
      .get<CsrfTokenResponse>(`${this.apiBaseUrl}/auth/csrf`)
      .pipe(
        catchError((error: unknown) => {
          this.tokenRequest$ = undefined;
          return throwError(() => error);
        }),
        tap(({ token }) => storeCsrfCookie(token)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.tokenRequest$;
  }

  refreshToken(): Observable<CsrfTokenResponse> {
    this.tokenRequest$ = undefined;
    return this.token();
  }
}

function storeCsrfCookie(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = globalThis.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `XSRF-TOKEN=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
}
