import { TestBed } from '@angular/core/testing';
import { AuthService } from '@features/auth/application/auth.service';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { ApplicationNavigation } from '../../../application-navigation/application-navigation';

const adminUser: AuthUser = {
  id: 1,
  personId: 1,
  names: 'Ana',
  lastNames: 'Admin',
  email: 'admin@flowerdetails.test',
  phone: '0999999999',
  documentNumber: '0102030405',
  role: 'ADMIN',
};

function createAuthService(user: AuthUser | null, logoutResult: Observable<void> = of(undefined)) {
  const currentUser = signal(user);

  return {
    user: currentUser.asReadonly(),
    logout: vi.fn(() => logoutResult),
  };
}

describe('ApplicationNavigation', () => {
  async function createComponent(user: AuthUser | null, logoutResult?: Observable<void>) {
    const authService = createAuthService(user, logoutResult);

    await TestBed.configureTestingModule({
      imports: [ApplicationNavigation],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ApplicationNavigation);
    fixture.detectChanges();

    return { fixture, authService, router: TestBed.inject(Router) };
  }

  it('shows the administration links only to administrators', async () => {
    const { fixture } = await createComponent(adminUser);

    const labels = fixture.componentInstance['navigationItems']().map((item) => item.label);

    expect(labels).toEqual(['Inicio', 'Categorías', 'Productos', 'Personal']);
  });

  it('shows only public navigation to customers and guests', async () => {
    const { fixture } = await createComponent({ ...adminUser, role: 'CUSTOMER' });
    expect(fixture.componentInstance['navigationItems']().map((item) => item.label)).toEqual([
      'Inicio',
    ]);

    TestBed.resetTestingModule();
    const guest = await createComponent(null);
    expect(guest.fixture.componentInstance['navigationItems']().map((item) => item.label)).toEqual([
      'Inicio',
    ]);
  });

  it('toggles the mobile menu state', async () => {
    const { fixture } = await createComponent(adminUser);
    const component = fixture.componentInstance;

    expect(component['isMenuOpen']()).toBe(false);
    component['toggleMenu']();
    expect(component['isMenuOpen']()).toBe(true);
    component['closeMenu']();
    expect(component['isMenuOpen']()).toBe(false);
  });

  it('navigates home after a successful logout', async () => {
    const { fixture, authService, router } = await createComponent(adminUser);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance['logout']();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });

  it('shows an error and returns home when logout fails', async () => {
    const { fixture, router } = await createComponent(
      adminUser,
      throwError(() => new Error('Offline')),
    );
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance['logout']();

    expect(fixture.componentInstance['logoutError']()).toContain('No se pudo confirmar');
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });
});
