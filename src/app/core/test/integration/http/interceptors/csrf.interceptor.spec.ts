import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { csrfInterceptor } from '@core/http/interceptors/csrf.interceptor';

describe('csrfInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([csrfInterceptor])), provideHttpClientTesting()],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('does not request a token for safe requests', () => {
    httpClient.get('/api/categories').subscribe();

    const request = httpTestingController.expectOne('/api/categories');
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    request.flush({});
  });

  it('does not require a token to authenticate', () => {
    httpClient.post('/api/auth/login', {}).subscribe();

    const request = httpTestingController.expectOne('/api/auth/login');
    expect(request.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    request.flush({});
  });

  it('reuses the cached token for subsequent mutating requests', () => {
    httpClient.post('/api/categories', {}).subscribe();

    const csrfRequest = httpTestingController.expectOne('/api/auth/csrf');
    csrfRequest.flush({ headerName: 'X-XSRF-TOKEN', token: 'first-token' });

    const firstCategoryRequest = httpTestingController.expectOne('/api/categories');
    expect(firstCategoryRequest.request.headers.get('X-XSRF-TOKEN')).toBe('first-token');
    firstCategoryRequest.flush({});

    httpClient.put('/api/categories/1', {}).subscribe();

    const secondCategoryRequest = httpTestingController.expectOne('/api/categories/1');
    expect(secondCategoryRequest.request.headers.get('X-XSRF-TOKEN')).toBe('first-token');
    secondCategoryRequest.flush({});
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
});
