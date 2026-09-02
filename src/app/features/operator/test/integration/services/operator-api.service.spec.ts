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
      providers: [OperatorApiService, provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
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
    const payload = {
      names: 'Ana',
      lastNames: 'Flor',
      email: 'ana@example.com',
      password: 'Password123',
      phone: '0999999999',
      role: 'ADMIN' as const,
      active: true,
    };

    service.create(payload).subscribe();

    const request = httpTestingController.expectOne('/api/users/staff');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('updates an administrative user with the supplied payload', () => {
    const payload = {
      names: 'Ana',
      lastNames: 'Flor',
      email: 'ana@example.com',
      phone: '0999999999',
      role: 'OPERATOR' as const,
      active: false,
    };

    service.update(4, payload).subscribe();

    const request = httpTestingController.expectOne('/api/users/staff/4');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({});
  });

  it('activates and deactivates an administrative user', () => {
    service.activate(4).subscribe();
    const activateRequest = httpTestingController.expectOne('/api/users/4/activate');
    expect(activateRequest.request.method).toBe('PATCH');
    expect(activateRequest.request.body).toEqual({});
    activateRequest.flush({});

    service.deactivate(4).subscribe();
    const deactivateRequest = httpTestingController.expectOne('/api/users/4/deactivate');
    expect(deactivateRequest.request.method).toBe('PATCH');
    expect(deactivateRequest.request.body).toEqual({});
    deactivateRequest.flush({});
  });

  it('deletes an administrative user by identifier', () => {
    service.delete(4).subscribe();

    const request = httpTestingController.expectOne('/api/users/4');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
