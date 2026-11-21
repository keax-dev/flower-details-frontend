import { catchError, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { inject, Service } from '@angular/core';
import { API_BASE_URL } from '@core/http/config/api.config';
import { HttpClient } from '@angular/common/http';

interface CsrfTokenResponse {
  headerName: string;
  token: string;
}

@Service()
export class CsrfService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  private tokenRequest$?: Observable<CsrfTokenResponse>;

  token(): Observable<CsrfTokenResponse> {
    this.tokenRequest$ ??= this.httpClient.get<unknown>(`${this.apiBaseUrl}/auth/csrf`).pipe(
      map((response) => {
        if (
          typeof response !== 'object' ||
          response === null ||
          !('headerName' in response) ||
          response.headerName !== 'X-XSRF-TOKEN' ||
          !('token' in response) ||
          typeof response.token !== 'string' ||
          !/^[A-Za-z0-9_+=/-]{1,256}$/.test(response.token)
        )
          throw new Error('Respuesta CSRF invalida');
        return { headerName: response.headerName, token: response.token };
      }),
      catchError((error: unknown) => {
        this.tokenRequest$ = undefined;
        return throwError(() => error);
      }),
      tap(({ token }) => this.storeCsrfCookie(token)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.tokenRequest$;
  }

  refreshToken(): Observable<CsrfTokenResponse> {
    this.tokenRequest$ = undefined;
    return this.token();
  }

  storeCsrfCookie(token: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    const secure = globalThis.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `XSRF-TOKEN=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }
}
