import { finalize, map, Observable, of, shareReplay } from 'rxjs';
import { inject, Service } from '@angular/core';
import { API_BASE_URL } from '@core/http/config/api.config';
import { HttpClient, HttpXsrfTokenExtractor } from '@angular/common/http';

interface CsrfTokenResponse {
  headerName: string;
  token: string;
}

@Service()
export class CsrfService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);
  private readonly tokenExtractor = inject(HttpXsrfTokenExtractor);

  // Share only in-flight requests; completed responses can outlive the server cookie.
  private tokenRequest$?: Observable<CsrfTokenResponse>;

  token(): Observable<CsrfTokenResponse> {
    if (this.tokenRequest$) return this.tokenRequest$;

    const token = this.tokenExtractor.getToken();
    return token !== null && isValidToken(token) ? of({ headerName: 'X-XSRF-TOKEN', token }) : this.fetchToken();
  }

  refreshToken(): Observable<CsrfTokenResponse> {
    return this.fetchToken();
  }

  private fetchToken(): Observable<CsrfTokenResponse> {
    this.tokenRequest$ ??= this.httpClient.get<unknown>(`${this.apiBaseUrl}/auth/csrf`).pipe(
      map((response) => {
        if (
          typeof response !== 'object' ||
          response === null ||
          !('headerName' in response) ||
          response.headerName !== 'X-XSRF-TOKEN' ||
          !('token' in response) ||
          typeof response.token !== 'string' ||
          !isValidToken(response.token)
        )
          throw new Error('Respuesta CSRF invalida');
        return { headerName: response.headerName, token: response.token };
      }),
      finalize(() => (this.tokenRequest$ = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.tokenRequest$;
  }
}

function isValidToken(token: string): boolean {
  return /^[A-Za-z0-9_+=/-]{1,256}$/.test(token);
}
