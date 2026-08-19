import { computed, Service, signal } from '@angular/core';

import { AuthUser } from '../domain/model/auth-user.model';

@Service()
export class AuthSessionStore {
  private readonly currentUser = signal<AuthUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  setUser(user: AuthUser): void {
    this.currentUser.set(user);
  }

  clear(): void {
    this.currentUser.set(null);
  }
}
