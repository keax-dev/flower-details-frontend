import { computed, Service, signal } from '@angular/core';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';

@Service()
export class AuthSessionStore {
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly sessionVersion = signal(0);

  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly user = this.currentUser.asReadonly();
  readonly version = this.sessionVersion.asReadonly();

  setUser(user: AuthUser): void {
    this.sessionVersion.update((version) => version + 1);
    this.currentUser.set(user);
  }

  clear(): void {
    this.sessionVersion.update((version) => version + 1);
    this.currentUser.set(null);
  }
}
