import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut, lucideMenu, lucideX } from '@ng-icons/lucide';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { filter, finalize, map } from 'rxjs';

import { AuthService } from '../../features/auth/application/auth.service';
import { UserRole } from '../../features/auth/domain/model/auth-user.model';

interface NavigationItem {
  label: string;
  route: string;
}

const NAVIGATION_BY_ROLE: Readonly<Record<UserRole, readonly NavigationItem[]>> = {
  ADMIN: [
    { label: 'Inicio', route: '/home' },
    { label: 'Categorías', route: '/admin/categories' },
    { label: 'Productos', route: '/admin/products' },
  ],
  OPERATOR: [{ label: 'Inicio', route: '/home' }],
  CUSTOMER: [{ label: 'Inicio', route: '/home' }],
};

@Component({
  selector: 'app-application-navigation',
  imports: [HlmButtonImports, NgIcon, RouterLink, RouterLinkActive],
  providers: [provideIcons({ lucideLogOut, lucideMenu, lucideX })],
  templateUrl: './application-navigation.html',
})
export class ApplicationNavigation {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly isMenuOpen = signal(false);
  protected readonly isLoggingOut = signal(false);
  protected readonly logoutError = signal<string | null>(null);
  protected readonly user = this.authService.user;
  protected readonly navigationItems = computed(() => {
    const user = this.user();
    return user === null ? [{ label: 'Inicio', route: '/home' }] : NAVIGATION_BY_ROLE[user.role];
  });
  protected readonly isVisible = computed(() => !this.currentUrl().startsWith('/auth'));

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected logout(): void {
    this.logoutError.set(null);
    this.isLoggingOut.set(true);
    this.authService
      .logout()
      .pipe(
        finalize(() => this.isLoggingOut.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/home']),
        error: () => this.logoutError.set('No se pudo cerrar la sesión. Inténtalo nuevamente.'),
      });
  }
}
