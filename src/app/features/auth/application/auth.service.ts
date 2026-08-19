import { LoginRequest, LoginResponse } from '@features/auth/domain/model/login.model';
import { API_BASE_URL } from '@core/http/config/api.config';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { finalize } from 'rxjs';

import { AuthSessionStore } from './auth-session.store';

@Service()
export class AuthService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);
  private readonly sessionStore = inject(AuthSessionStore);

  readonly user = this.sessionStore.user;
  readonly isAuthenticated = this.sessionStore.isAuthenticated;

  login(request: LoginRequest): Observable<AuthUser> {
    return this.httpClient.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, request).pipe(
      map((response) => response.user),
      tap((user) => this.sessionStore.setUser(user)),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    return this.httpClient.get<AuthUser>(`${this.apiBaseUrl}/me`).pipe(
      tap((user) => this.sessionStore.setUser(user)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.sessionStore.clear();
          return of(null);
        }

        return throwError(() => error);
      }),
    );
  }

  logout(): Observable<void> {
    return this.httpClient
      .post<void>(`${this.apiBaseUrl}/auth/logout`, {})
      .pipe(finalize(() => this.sessionStore.clear()));
  }
}
