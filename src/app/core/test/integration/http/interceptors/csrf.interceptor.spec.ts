import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { csrfInterceptor } from '@core/http/interceptors/csrf.interceptor';

describe('csrfInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=; Path=/; Max-Age=0';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([csrfInterceptor])), provideHttpClientTesting()],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Path=/; Max-Age=0';
    httpTestingController.verify();
  });

  it('rejects malformed CSRF responses without sending the mutation', () => {
    const errors: unknown[] = [];
    httpClient.post('/api/auth/login', {}).subscribe({ error: (error: unknown) => errors.push(error) });
    httpTestingController.expectOne('/api/auth/csrf').flush({ headerName: 'Authorization', token: 'untrusted' });
    httpTestingController.expectNone('/api/auth/login');
    expect(errors).toHaveLength(1);
  });

  it('does not request a token for safe requests', () => {
    httpClient.get('/api/categories').subscribe();

    const request = httpTestingController.expectOne('/api/categories');
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    request.flush({});
  });

  it('requires a CSRF token to authenticate', () => {
    httpClient.post('/api/auth/login', {}).subscribe();

    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'login-token' });

    const loginRequest = httpTestingController.expectOne('/api/auth/login');
    expect(loginRequest.request.headers.get('X-XSRF-TOKEN')).toBe('login-token');
    loginRequest.flush({});
  });

  it('requires a CSRF token to register an account', () => {
    httpClient.post('/api/auth/register', {}).subscribe();

    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'registration-token' });

    const registrationRequest = httpTestingController.expectOne('/api/auth/register');
    expect(registrationRequest.request.headers.get('X-XSRF-TOKEN')).toBe('registration-token');
    registrationRequest.flush({});
  });

  it('reuses the server cookie for subsequent mutating requests without fetching another token', () => {
    httpClient.post('/api/categories', {}).subscribe();

    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    document.cookie = 'XSRF-TOKEN=first-token; Path=/';
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'first-token' });

    const firstCategoryRequest = httpTestingController.expectOne('/api/categories');
    expect(firstCategoryRequest.request.headers.get('X-XSRF-TOKEN')).toBe('first-token');
    firstCategoryRequest.flush({});

    httpClient.put('/api/categories/1', {}).subscribe();

    const secondCategoryRequest = httpTestingController.expectOne('/api/categories/1');
    expect(secondCategoryRequest.request.headers.get('X-XSRF-TOKEN')).toBe('first-token');
    secondCategoryRequest.flush({});
    httpTestingController.expectNone('/api/auth/csrf');
  });

  it('uses a rotated cookie on every cart addition instead of the previous response cached in memory', () => {
    httpClient.post('/api/cart/items', { productId: 4, quantity: 1 }).subscribe();
    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    document.cookie = 'XSRF-TOKEN=initial-token; Path=/';
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'initial-token' });
    httpTestingController.expectOne('/api/cart/items').flush({});

    for (const token of ['rotated-token-1', 'rotated-token-2', 'rotated-token-3']) {
      document.cookie = `XSRF-TOKEN=${token}; Path=/`;
      httpClient.post('/api/cart/items', { productId: 4, quantity: 1 }).subscribe();
      const request = httpTestingController.expectOne('/api/cart/items');
      expect(request.request.headers.get('X-XSRF-TOKEN')).toBe(token);
      request.flush({});
      httpTestingController.expectNone('/api/auth/csrf');
    }
  });

  it('fetches a new token before the mutation when the cookie has been removed', () => {
    document.cookie = 'XSRF-TOKEN=old-token; Path=/';
    httpClient.post('/api/cart/items', {}).subscribe();
    httpTestingController.expectOne('/api/cart/items').flush({});
    document.cookie = 'XSRF-TOKEN=; Path=/; Max-Age=0';

    httpClient.post('/api/cart/items', {}).subscribe();
    httpTestingController.expectNone('/api/cart/items');
    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    document.cookie = 'XSRF-TOKEN=new-token; Path=/';
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'new-token' });
    const request = httpTestingController.expectOne('/api/cart/items');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('new-token');
    request.flush({});
  });

  it('shares a token request between concurrent mutations', () => {
    httpClient.post('/api/cart/items', {}).subscribe();
    httpClient.put('/api/cart/items/1', {}).subscribe();
    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    document.cookie = 'XSRF-TOKEN=shared-token; Path=/';
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'shared-token' });
    for (const url of ['/api/cart/items', '/api/cart/items/1']) {
      const request = httpTestingController.expectOne(url);
      expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('shared-token');
      request.flush({});
    }
  });

  it('refreshes the token and retries once when the backend reports an invalid CSRF token', () => {
    httpClient.delete('/api/categories/1').subscribe();

    const initialCsrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    initialCsrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'expired-token' });

    const rejectedRequest = httpTestingController.expectOne('/api/categories/1');
    rejectedRequest.flush({ code: 'CSRF_TOKEN_INVALID' }, { status: 403, statusText: 'Forbidden' });

    const refreshedCsrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    refreshedCsrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'fresh-token' });

    const retriedRequest = httpTestingController.expectOne('/api/categories/1');
    expect(retriedRequest.request.headers.get('X-XSRF-TOKEN')).toBe('fresh-token');
    retriedRequest.flush({});
  });

  it('does not refresh or retry an authorization denial', () => {
    document.cookie = 'XSRF-TOKEN=valid-token; Path=/';
    const statuses: number[] = [];
    httpClient.post('/api/cart/items', {}).subscribe({ error: (error: { status: number }) => statuses.push(error.status) });
    httpTestingController.expectOne('/api/cart/items').flush({ code: 'ACCESS_DENIED' }, { status: 403, statusText: 'Forbidden' });
    expect(statuses).toEqual([403]);
    httpTestingController.expectNone('/api/auth/csrf');
    httpTestingController.expectNone('/api/cart/items');
  });

  it('stops after one retry when the refreshed token is also rejected', () => {
    document.cookie = 'XSRF-TOKEN=old-token; Path=/';
    const statuses: number[] = [];
    httpClient.post('/api/cart/items', {}).subscribe({ error: (error: { status: number }) => statuses.push(error.status) });
    httpTestingController.expectOne('/api/cart/items').flush({ code: 'CSRF_TOKEN_INVALID' }, { status: 403, statusText: 'Forbidden' });
    const refreshedCsrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    document.cookie = 'XSRF-TOKEN=new-token; Path=/';
    refreshedCsrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'new-token' });
    httpTestingController.expectOne('/api/cart/items').flush({ code: 'CSRF_TOKEN_INVALID' }, { status: 403, statusText: 'Forbidden' });
    expect(statuses).toEqual([403]);
    httpTestingController.expectNone('/api/auth/csrf');
    httpTestingController.expectNone('/api/cart/items');
  });
});
