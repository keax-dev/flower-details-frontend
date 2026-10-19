import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '@core/http/config/api.config';
import { CustomerApiService } from '@features/customer/services/customer-api.service';

describe('CustomerApiService', () => {
  let service: CustomerApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomerApiService, provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    service = TestBed.inject(CustomerApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests a page containing only customers', () => {
    service.list(1, 10).subscribe();

    const request = httpTestingController.expectOne('/api/users/customers?page=1&size=10');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('uses the existing account status and deletion endpoints', () => {
    service.deactivate(7).subscribe();
    const deactivate = httpTestingController.expectOne('/api/users/7/deactivate');
    expect(deactivate.request.method).toBe('PATCH');
    deactivate.flush({});

    service.activate(7).subscribe();
    const activate = httpTestingController.expectOne('/api/users/7/activate');
    expect(activate.request.method).toBe('PATCH');
    activate.flush({});

    service.delete(7).subscribe();
    const deletion = httpTestingController.expectOne('/api/users/7');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
  });
});
