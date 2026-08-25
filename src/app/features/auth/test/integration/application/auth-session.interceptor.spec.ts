import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthSessionStore } from '@features/auth/application/auth-session.store';
import { authSessionInterceptor } from '@features/auth/application/auth-session.interceptor';
import { Router } from '@angular/router';

describe('authSessionInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let sessionStore: { clear: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn>; url: string };

  beforeEach(() => {
    sessionStore = { clear: vi.fn() };
    router = { navigate: vi.fn().mockResolvedValue(true), url: '/admin/categories' };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authSessionInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthSessionStore, useValue: sessionStore },
        { provide: Router, useValue: router },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('clears the session and redirects when a protected API request receives 401', () => {
    httpClient.get('/api/categories').subscribe({ error: () => undefined });

    httpTestingController
      .expectOne('/api/categories')
      .flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(sessionStore.clear).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/admin/categories' },
    });
  });

  it('does not redirect when login itself is rejected', () => {
    httpClient.post('/api/auth/login', {}).subscribe({ error: () => undefined });

    httpTestingController
      .expectOne('/api/auth/login')
      .flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(sessionStore.clear).toHaveBeenCalledOnce();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not alter failed requests to external resources', () => {
    const externalUrl = 'https://cdn.example.com/product.png';
    httpClient.get(externalUrl).subscribe({ error: () => undefined });

    httpTestingController
      .expectOne(externalUrl)
      .flush({ message: 'Forbidden' }, { status: 401, statusText: 'Unauthorized' });

    expect(sessionStore.clear).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
