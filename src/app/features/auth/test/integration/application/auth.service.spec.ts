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

  it('registers a customer and stores the new session', () => {
    const customer: AuthUser = { ...USER, role: 'CUSTOMER' };
    const registration = {
      names: customer.names,
      lastNames: customer.lastNames,
      email: customer.email,
      password: 'Password123',
      phone: customer.phone,
      documentNumber: customer.documentNumber,
    };

    authService.register(registration).subscribe();

    const request = httpTestingController.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(registration);
    request.flush({ expiresInSeconds: 3600, user: customer });

    expect(authService.user()).toEqual(customer);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('updates the customer profile and refreshes the current user', () => {
    const customer: AuthUser = { ...USER, role: 'CUSTOMER' };
    authService.login({ email: customer.email, password: 'Password123' }).subscribe();
    httpTestingController.expectOne('/api/auth/login').flush({ expiresInSeconds: 3600, user: customer });

    const request = { names: 'Lucía', lastNames: 'Flores', email: 'lucia@example.com', phone: '', documentNumber: '' };
    const updated = { ...customer, ...request };
    authService.updateProfile(request).subscribe();

    const httpRequest = httpTestingController.expectOne('/api/me');
    expect(httpRequest.request.method).toBe('PUT');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush(updated);

    expect(authService.user()).toEqual(updated);
  });

  it('does not restore an old profile response after logout', () => {
    const customer: AuthUser = { ...USER, role: 'CUSTOMER' };
    authService.login({ email: customer.email, password: 'Password123' }).subscribe();
    httpTestingController.expectOne('/api/auth/login').flush({ expiresInSeconds: 3600, user: customer });

    authService.updateProfile({ names: 'Lucía', lastNames: customer.lastNames, email: customer.email, phone: '', documentNumber: '' }).subscribe();
    const profileRequest = httpTestingController.expectOne('/api/me');
    authService.logout().subscribe();
    httpTestingController.expectOne('/api/auth/logout').flush(null);
    profileRequest.flush({ ...customer, names: 'Lucía' });

    expect(authService.user()).toBeNull();
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

  it('does not replace a newly registered session with a late restoration response', () => {
    const customer: AuthUser = { ...USER, role: 'CUSTOMER' };
    const restoredUsers: (AuthUser | null)[] = [];
    authService.restoreSession().subscribe((user) => restoredUsers.push(user));
    const restoreRequest = httpTestingController.expectOne('/api/me');

    authService.register({ names: 'Ana', lastNames: 'Pérez', email: USER.email, password: 'Password123', phone: '', documentNumber: '' }).subscribe();
    httpTestingController.expectOne('/api/auth/register').flush({ expiresInSeconds: 3600, user: customer });
    restoreRequest.flush(USER);

    expect(authService.user()).toEqual(customer);
    expect(restoredUsers).toEqual([customer]);
  });

  it('does not clear a newly logged-in session when an older restoration gets 401', () => {
    authService.restoreSession().subscribe();
    const restoreRequest = httpTestingController.expectOne('/api/me');

    authService.login({ email: USER.email, password: 'Password123' }).subscribe();
    httpTestingController.expectOne('/api/auth/login').flush({ expiresInSeconds: 3600, user: USER });
    restoreRequest.flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.user()).toEqual(USER);
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
