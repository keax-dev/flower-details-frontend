import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoginRequest, LoginResponse } from '@features/auth/domain/model/login.model';
import { AuthSessionStore } from './auth-session.store';
import { inject, Service } from '@angular/core';
import { API_BASE_URL } from '@core/http/config/api.config';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';
import { RegisterRequest } from '@features/auth/domain/model/register.model';
import { UpdateProfileRequest } from '@features/auth/domain/model/update-profile.model';

@Service()
export class AuthService {
  private readonly sessionStore = inject(AuthSessionStore);
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private restoreSessionRequest$?: Observable<AuthUser | null>;
  private sessionVersion = 0;

  readonly isAuthenticated = this.sessionStore.isAuthenticated;
  readonly user = this.sessionStore.user;

  login(request: LoginRequest): Observable<AuthUser> {
    return this.httpClient.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, request).pipe(
      map((response) => response.user),
      tap((user) => this.setUser(user)),
    );
  }

  register(request: RegisterRequest): Observable<AuthUser> {
    return this.httpClient.post<LoginResponse>(`${this.apiBaseUrl}/auth/register`, request).pipe(
      map((response) => response.user),
      tap((user) => this.setUser(user)),
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<AuthUser> {
    const requestVersion = this.sessionVersion;
    return this.httpClient.put<AuthUser>(`${this.apiBaseUrl}/me`, request).pipe(
      tap((user) => {
        if (this.sessionVersion === requestVersion) {
          this.setUser(user);
        }
      }),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    if (this.sessionStore.user() !== null) {
      return of(this.sessionStore.user());
    }
    const requestVersion = this.sessionVersion;
    this.restoreSessionRequest$ ??= this.httpClient.get<AuthUser>(`${this.apiBaseUrl}/me`).pipe(
      tap((user) => {
        if (this.sessionVersion === requestVersion) {
          this.sessionStore.setUser(user);
        }
      }),
      map((user) => (this.sessionVersion === requestVersion ? user : this.sessionStore.user())),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          if (this.sessionVersion === requestVersion) {
            this.sessionStore.clear();
          }
          return of(this.sessionStore.user());
        }

        return throwError(() => error);
      }),
      finalize(() => (this.restoreSessionRequest$ = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.restoreSessionRequest$;
  }

  logout(): Observable<void> {
    this.sessionVersion += 1;
    return this.httpClient.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(finalize(() => this.sessionStore.clear()));
  }

  private setUser(user: AuthUser): void {
    this.sessionVersion += 1;
    this.sessionStore.setUser(user);
  }
}
