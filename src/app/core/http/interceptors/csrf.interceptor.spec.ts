import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { csrfInterceptor } from './csrf.interceptor';

describe('csrfInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

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
