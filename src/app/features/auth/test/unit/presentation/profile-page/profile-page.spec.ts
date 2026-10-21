import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { AuthService } from '@features/auth/application/auth.service';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';
import { ProfilePage } from '@features/auth/presentation/profile-page/profile-page';

const CUSTOMER: AuthUser = {
  id: 3,
  personId: 9,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '',
  role: 'CUSTOMER',
};

async function createComponent(result = of(CUSTOMER)) {
  const authService = { user: signal(CUSTOMER), updateProfile: vi.fn(() => result) };
  await TestBed.configureTestingModule({
    imports: [ProfilePage],
    providers: [{ provide: AuthService, useValue: authService }],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProfilePage);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture, authService };
}

describe('ProfilePage', () => {
  it('prefills the customer data and submits trimmed values', async () => {
    const updated = { ...CUSTOMER, names: 'Lucía' };
    const { component, authService } = await createComponent(of(updated));
    expect(component['profileForm'].getRawValue().names).toBe('Ana');

    component['profileForm'].controls.names.setValue('  Lucía  ');
    component['submit']();

    expect(authService.updateProfile).toHaveBeenCalledWith({
      names: 'Lucía',
      lastNames: 'Pérez',
      email: CUSTOMER.email,
      phone: CUSTOMER.phone,
      documentNumber: '',
    });
    expect(component['saved']()).toBe(true);
    expect(component['profileForm'].pristine).toBe(true);

    component['profileForm'].controls.names.setValue('Otro nombre');
    expect(component['saved']()).toBe(false);
  });

  it('does not submit invalid data', async () => {
    const { component, authService } = await createComponent();
    component['profileForm'].controls.names.setValue('   ');

    component['submit']();

    expect(authService.updateProfile).not.toHaveBeenCalled();
    expect(component['hasError']('names')).toBe(true);
  });

  it('shows an API error without claiming the profile was saved', async () => {
    const { component } = await createComponent(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'El correo ya está registrado.' } })),
    );
    component['profileForm'].controls.email.setValue('duplicate@example.com');

    component['submit']();

    expect(component['saved']()).toBe(false);
    expect(component['errorMessage']()).toBe('El correo ya está registrado.');
  });
});
