import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@features/auth/application/auth.service';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';
import { LoginPage } from '@features/auth/presentation/login-page/login-page';
import { of, throwError } from 'rxjs';

const USER: AuthUser = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Pérez',
  email: 'ana@example.com',
  phone: '0999999999',
  documentNumber: '0102030405',
  role: 'ADMIN',
};

async function createComponent(returnUrl: string | null, loginResult = of(USER)) {
  const authService = { login: vi.fn(() => loginResult) };
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  await TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: { get: () => returnUrl } } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(LoginPage);
  return { component: fixture.componentInstance, authService, router };
}

describe('LoginPage', () => {
  it('does not submit an invalid form', async () => {
    const { component, authService } = await createComponent(null);

    component['submit']();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component['loginForm'].touched).toBe(true);
  });

  it('redirects to the validated return URL after a successful login', async () => {
    const { component, authService, router } = await createComponent('/admin/categories');
    component['loginForm'].setValue({ email: USER.email, password: 'correct-password' });

    component['submit']();

    expect(authService.login).toHaveBeenCalledWith({
      email: USER.email,
      password: 'correct-password',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/categories');
  });

  it('rejects an unsafe external return URL', async () => {
    const { component, router } = await createComponent('//malicious.example.com');
    component['loginForm'].setValue({ email: USER.email, password: 'correct-password' });

    component['submit']();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('displays the API error when login fails', async () => {
    const { component } = await createComponent(
      null,
      throwError(
        () =>
          new HttpErrorResponse({
            error: { message: 'Credenciales inválidas.' },
            status: 401,
          }),
      ),
    );
    component['loginForm'].setValue({ email: USER.email, password: 'wrong-password' });

    component['submit']();

    expect(component['errorMessage']()).toBe('Credenciales inválidas.');
    expect(component['isSubmitting']()).toBe(false);
  });
});
