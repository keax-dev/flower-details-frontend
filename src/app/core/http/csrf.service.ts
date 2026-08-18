import { catchError, map, Observable, of, shareReplay } from 'rxjs';

import { API_BASE_URL } from './api.config';
import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

interface CsrfTokenResponse {
  headerName: string;
  token: string;
}

@Service()
export class CsrfService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  private initialization$?: Observable<void>;

  initialize(): Observable<void> {
    this.initialization$ ??= this.httpClient
      .get<CsrfTokenResponse>(`${this.apiBaseUrl}/auth/csrf`)
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.initialization$;
  }
}
