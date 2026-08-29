import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@features/auth/application/auth.service';
import { AuthUser } from '@features/auth/domain/model/auth-user.model';

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

describe('AuthService', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('stores the authenticated user after login', () => {
    authService.login({ email: USER.email, password: 'correct-password' }).subscribe();

    const request = httpTestingController.expectOne('/api/auth/login');
    request.flush({ expiresInSeconds: 3600, user: USER });

    expect(authService.user()).toEqual(USER);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('clears the session and returns null when the session is no longer authorized', () => {
    let restoredUser: AuthUser | null | undefined;

    authService.restoreSession().subscribe((user) => (restoredUser = user));

    const request = httpTestingController.expectOne('/api/me');
    request.flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(restoredUser).toBeNull();
    expect(authService.user()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('shares an in-progress session restoration request', () => {
    const restoredUsers: (AuthUser | null)[] = [];

    authService.restoreSession().subscribe((user) => restoredUsers.push(user));
    authService.restoreSession().subscribe((user) => restoredUsers.push(user));

    const request = httpTestingController.expectOne('/api/me');
    request.flush(USER);

    expect(restoredUsers).toEqual([USER, USER]);
  });

  it('preserves a server error so the application can distinguish it from a logged out session', () => {
    const receivedErrors: HttpErrorResponse[] = [];

    authService.restoreSession().subscribe({
      error: (error: HttpErrorResponse) => receivedErrors.push(error),
    });

    const request = httpTestingController.expectOne('/api/me');
    request.flush({ message: 'Error interno' }, { status: 500, statusText: 'Server Error' });

    expect(receivedErrors.at(0)?.status).toBe(500);
    expect(authService.user()).toBeNull();
  });

  it('clears the local session when logout cannot reach the server', () => {
    authService.login({ email: USER.email, password: 'correct-password' }).subscribe();
    httpTestingController.expectOne('/api/auth/login').flush({ expiresInSeconds: 3600, user: USER });

    authService.logout().subscribe({ error: () => undefined });
    httpTestingController
      .expectOne('/api/auth/logout')
      .flush({ message: 'Servicio no disponible' }, { status: 503, statusText: 'Service Unavailable' });

    expect(authService.user()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });
});
