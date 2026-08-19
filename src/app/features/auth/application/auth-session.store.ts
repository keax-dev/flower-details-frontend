import { computed, Service, signal } from '@angular/core';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';

@Service()
export class AuthSessionStore {
  private readonly currentUser = signal<AuthUser | null>(null);

  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly user = this.currentUser.asReadonly();

  setUser(user: AuthUser): void {
    this.currentUser.set(user);
  }

  clear(): void {
    this.currentUser.set(null);
  }
}
