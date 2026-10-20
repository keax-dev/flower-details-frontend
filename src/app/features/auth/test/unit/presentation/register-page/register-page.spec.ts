import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '@features/auth/application/auth.service';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';
import { RegisterPage } from '@features/auth/presentation/register-page/register-page';

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

async function createComponent(registerResult = of(CUSTOMER)) {
  const authService = { register: vi.fn(() => registerResult) };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  await TestBed.configureTestingModule({
    imports: [RegisterPage],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(RegisterPage);
  return { component: fixture.componentInstance, authService, router };
}

function fillValidForm(component: RegisterPage): void {
  component['registerForm'].setValue({
    names: ' Ana ',
    lastNames: ' Pérez ',
    email: 'ana@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    phone: ' 0999999999 ',
    documentNumber: '',
  });
}

describe('RegisterPage', () => {
  it('rejects weak passwords and mismatched confirmation', async () => {
    const { component, authService } = await createComponent();
    fillValidForm(component);
    component['registerForm'].controls.password.setValue('weak');
    component['submit']();
    expect(authService.register).not.toHaveBeenCalled();

    component['registerForm'].controls.password.setValue('Password123');
    component['registerForm'].controls.confirmPassword.setValue('Different123');
    component['submit']();
    expect(component['hasPasswordMismatch']()).toBe(true);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('registers with trimmed profile data and navigates home', async () => {
    const { component, authService, router } = await createComponent();
    fillValidForm(component);

    component['submit']();

    expect(authService.register).toHaveBeenCalledWith({
      names: 'Ana',
      lastNames: 'Pérez',
      email: 'ana@example.com',
      password: 'Password123',
      phone: '0999999999',
      documentNumber: '',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('shows the server error without navigating away', async () => {
    const { component, router } = await createComponent(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'El correo ya está registrado.' } })),
    );
    fillValidForm(component);

    component['submit']();

    expect(component['errorMessage']()).toBe('El correo ya está registrado.');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
