import { API_BASE_URL } from '../../../core/http/api.config';
import { LoginRequest, LoginResponse } from '../domain/model/login.model';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { AuthUser } from '../domain/model/auth-user.model';
import { catchError, map, Observable, of, tap } from 'rxjs';

@Service()
export class AuthService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);
  private readonly currentUser = signal<AuthUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(request: LoginRequest): Observable<AuthUser> {
    return this.httpClient.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, request).pipe(
      map((response) => response.user),
      tap((user) => this.currentUser.set(user)),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    return this.httpClient.get<AuthUser>(`${this.apiBaseUrl}/me`).pipe(
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.httpClient
      .post<void>(`${this.apiBaseUrl}/auth/logout`, {})
      .pipe(tap(() => this.currentUser.set(null)));
  }
}
