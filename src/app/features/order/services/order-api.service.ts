import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/config/api.config';
import { OrderAudit } from '@features/order/models/order-audit.model';
import { OrderQuery } from '@features/order/models/order-query.model';
import { OrderStatus } from '@features/order/models/order-status.model';
import { Order } from '@features/order/models/order.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

@Service()
export class OrderApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  list(page: number, size: number, query: OrderQuery): Observable<PageResponse<Order>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sortBy', 'createdAt').set('direction', 'desc');
    if (query.q?.trim()) {
      params = params.set('q', query.q.trim());
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.fulfillmentType) {
      params = params.set('fulfillmentType', query.fulfillmentType);
    }

    return this.httpClient.get<PageResponse<Order>>(`${this.apiBaseUrl}/orders`, { params });
  }

  getById(id: number): Observable<Order> {
    return this.httpClient.get<Order>(`${this.apiBaseUrl}/orders/${id}`);
  }

  getAuditTrail(id: number): Observable<readonly OrderAudit[]> {
    return this.httpClient.get<readonly OrderAudit[]>(`${this.apiBaseUrl}/orders/${id}/audit`);
  }

  assign(id: number, operatorId?: number): Observable<Order> {
    return this.httpClient.patch<Order>(`${this.apiBaseUrl}/orders/${id}/assign`, operatorId === undefined ? {} : { operatorId });
  }

  changeStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.httpClient.patch<Order>(`${this.apiBaseUrl}/orders/${id}/status`, { status });
  }

  cancel(id: number, reason: string): Observable<void> {
    return this.httpClient.patch<void>(`${this.apiBaseUrl}/orders/${id}/cancel`, { reason });
  }
}
