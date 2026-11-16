import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, finalize, map } from 'rxjs';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBars,
  faBoxOpen,
  faCartShopping,
  faClipboardList,
  faHouse,
  faLeaf,
  faRightFromBracket,
  faRightToBracket,
  faTags,
  faUser,
  faUsers,
  faUsersGear,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '@features/auth/application/auth.service';
import { UserRole } from '@features/auth/domain/model/auth-user.model';

interface NavigationItem {
  icon: IconDefinition;
  label: string;
  route: string;
}

const NAVIGATION_BY_ROLE: Readonly<Record<UserRole, readonly NavigationItem[]>> = {
  ADMIN: [
    { icon: faHouse, label: 'Inicio', route: '/dashboard' },
    { icon: faTags, label: 'Categorías', route: '/admin/categories' },
    { icon: faBoxOpen, label: 'Productos', route: '/admin/products' },
    { icon: faUsersGear, label: 'Personal', route: '/admin/staff' },
    { icon: faUsers, label: 'Clientes', route: '/admin/customers' },
    { icon: faClipboardList, label: 'Pedidos', route: '/orders' },
  ],
  OPERATOR: [
    { icon: faHouse, label: 'Inicio', route: '/home' },
    { icon: faClipboardList, label: 'Pedidos', route: '/orders' },
  ],
  CUSTOMER: [
    { icon: faHouse, label: 'Inicio', route: '/home' },
    { icon: faLeaf, label: 'Catálogo', route: '/catalog' },
    { icon: faCartShopping, label: 'Carrito', route: '/cart' },
    { icon: faClipboardList, label: 'Mis pedidos', route: '/my-orders' },
    { icon: faUser, label: 'Mi perfil', route: '/profile' },
  ],
};

@Component({
  selector: 'app-application-navigation',
  imports: [FontAwesomeModule, NzButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './application-navigation.html',
  styleUrl: './application-navigation.css',
})
export class ApplicationNavigation {
  protected readonly faBars = faBars;
  protected readonly faLeaf = faLeaf;
  protected readonly faRightFromBracket = faRightFromBracket;
  protected readonly faRightToBracket = faRightToBracket;
  protected readonly faXmark = faXmark;
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

  protected readonly isLoggingOut = signal(false);
  protected readonly logoutError = signal<string | null>(null);
  protected readonly isMenuOpen = signal(false);

  protected readonly user = this.authService.user;
  protected readonly navigationItems = computed(() => {
    const user = this.user();
    return user === null
      ? [
          { icon: faHouse, label: 'Inicio', route: '/home' },
          { icon: faLeaf, label: 'Catálogo', route: '/catalog' },
        ]
      : NAVIGATION_BY_ROLE[user.role];
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
        error: () => {
          this.logoutError.set('No se pudo confirmar el cierre de sesión con el servidor.');
          void this.router.navigate(['/home']);
        },
      });
  }
}
