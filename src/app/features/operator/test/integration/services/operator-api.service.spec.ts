import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@core/http/config/api.config';
import { OperatorApiService } from '@features/operator/services/operator-api.service';

describe('OperatorApiService', () => {
  let service: OperatorApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OperatorApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(OperatorApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests the paginated operator list', () => {
    service.list(1, 10).subscribe();

    const request = httpTestingController.expectOne('/api/users/staff?page=1&size=10');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('creates an operator through the dedicated endpoint', () => {
    service
      .create({
        names: 'Ana',
        lastNames: 'Flor',
        email: 'ana@example.com',
        password: 'Password123',
        phone: '0999999999',
        role: 'OPERATOR',
        active: true,
      })
      .subscribe();

    const request = httpTestingController.expectOne('/api/users/staff');
    expect(request.request.method).toBe('POST');
    request.flush({});
  });
});
