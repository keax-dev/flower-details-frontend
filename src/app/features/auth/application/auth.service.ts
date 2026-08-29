import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoginRequest, LoginResponse } from '@features/auth/domain/model/login.model';
import { AuthSessionStore } from './auth-session.store';
import { inject, Service } from '@angular/core';
import { API_BASE_URL } from '@core/http/config/api.config';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';

@Service()
export class AuthService {
  private readonly sessionStore = inject(AuthSessionStore);
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private restoreSessionRequest$?: Observable<AuthUser | null>;

  readonly isAuthenticated = this.sessionStore.isAuthenticated;
  readonly user = this.sessionStore.user;

  login(request: LoginRequest): Observable<AuthUser> {
    return this.httpClient.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, request).pipe(
      map((response) => response.user),
      tap((user) => this.sessionStore.setUser(user)),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    this.restoreSessionRequest$ ??= this.httpClient.get<AuthUser>(`${this.apiBaseUrl}/me`).pipe(
      tap((user) => this.sessionStore.setUser(user)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.sessionStore.clear();
          return of(null);
        }

        return throwError(() => error);
      }),
      finalize(() => (this.restoreSessionRequest$ = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.restoreSessionRequest$;
  }

  logout(): Observable<void> {
    return this.httpClient.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(finalize(() => this.sessionStore.clear()));
  }
}
