import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@core/http/config/api.config';
import { OrderApiService } from '@features/order/services/order-api.service';

describe('OrderApiService', () => {
  let service: OrderApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrderApiService, provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    service = TestBed.inject(OrderApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('creates a customer order from the cart', () => {
    const payload = {
      fulfillmentType: 'DELIVERY' as const,
      contactName: 'Ana Pérez',
      contactPhone: '0999999999',
      deliveryAddress: 'Calle Flores 123',
      additionalInstructions: null,
      termsAccepted: true,
      termsVersion: '2026-10-22',
    };
    service.create(payload).subscribe();

    const request = httpTestingController.expectOne('/api/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 42, orderNumber: 'FD-42' });
  });

  it('requests orders with pagination, sorting and supplied filters', () => {
    service.list(1, 10, { q: ' Maria ', status: 'ASSIGNED', fulfillmentType: 'DELIVERY' }).subscribe();

    const request = httpTestingController.expectOne(
      '/api/orders?page=1&size=10&sortBy=createdAt&direction=desc&q=Maria&status=ASSIGNED&fulfillmentType=DELIVERY',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('requests only the authenticated customer orders with supported filters', () => {
    service
      .listMine(1, 10, {
        q: ' FD-42 ',
        status: 'GENERATED',
        fulfillmentType: 'DELIVERY',
        createdFrom: '2026-10-01',
        createdTo: '2026-10-21',
        sortBy: 'total',
        direction: 'asc',
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      '/api/orders/my?page=1&size=10&sortBy=total&direction=asc&q=FD-42&status=GENERATED&fulfillmentType=DELIVERY&createdFrom=2026-10-01&createdTo=2026-10-21',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 1, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('sends customer, operator, date range and selected sorting', () => {
    service
      .list(0, 10, {
        customerId: 3,
        operatorId: 5,
        createdFrom: '2026-10-01',
        createdTo: '2026-10-20',
        sortBy: 'total',
        direction: 'asc',
      })
      .subscribe();

    const request = httpTestingController.expectOne(
      '/api/orders?page=0&size=10&sortBy=total&direction=asc&customerId=3&operatorId=5&createdFrom=2026-10-01&createdTo=2026-10-20',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  });

  it('requests an order and its audit trail by identifier', () => {
    service.getById(12).subscribe();
    const orderRequest = httpTestingController.expectOne('/api/orders/12');
    expect(orderRequest.request.method).toBe('GET');
    orderRequest.flush({});

    service.getAuditTrail(12).subscribe();
    const auditRequest = httpTestingController.expectOne('/api/orders/12/audit');
    expect(auditRequest.request.method).toBe('GET');
    auditRequest.flush([]);
  });

  it('assigns an order to a selected operator or to the current operator', () => {
    service.assign(12, 5).subscribe();
    const adminRequest = httpTestingController.expectOne('/api/orders/12/assign');
    expect(adminRequest.request.method).toBe('PATCH');
    expect(adminRequest.request.body).toEqual({ operatorId: 5 });
    adminRequest.flush({});

    service.assign(12).subscribe();
    const operatorRequest = httpTestingController.expectOne('/api/orders/12/assign');
    expect(operatorRequest.request.body).toEqual({});
    operatorRequest.flush({});
  });

  it('changes a status and cancels an order with the supplied payloads', () => {
    service.changeStatus(12, 'IN_PREPARATION').subscribe();
    const statusRequest = httpTestingController.expectOne('/api/orders/12/status');
    expect(statusRequest.request.method).toBe('PATCH');
    expect(statusRequest.request.body).toEqual({ status: 'IN_PREPARATION' });
    statusRequest.flush({});

    service.cancel(12, 'Cliente solicitó cancelar').subscribe();
    const cancelRequest = httpTestingController.expectOne('/api/orders/12/cancel');
    expect(cancelRequest.request.method).toBe('PATCH');
    expect(cancelRequest.request.body).toEqual({ reason: 'Cliente solicitó cancelar' });
    cancelRequest.flush(null);
  });
});
