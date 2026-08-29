import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/config/api.config';
import { Operator } from '@features/operator/models/operator.model';
import {
  CreateOperatorPayload,
  UpdateOperatorPayload,
} from '@features/operator/models/operator-payload.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

@Service()
export class OperatorApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  list(page: number, size: number): Observable<PageResponse<Operator>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<PageResponse<Operator>>(`${this.apiBaseUrl}/users/operators`, {
      params,
    });
  }

  create(payload: CreateOperatorPayload): Observable<Operator> {
    return this.httpClient.post<Operator>(`${this.apiBaseUrl}/users/operators`, payload);
  }

  update(id: number, payload: UpdateOperatorPayload): Observable<Operator> {
    return this.httpClient.put<Operator>(`${this.apiBaseUrl}/users/operators/${id}`, payload);
  }

  activate(id: number): Observable<Operator> {
    return this.httpClient.patch<Operator>(`${this.apiBaseUrl}/users/${id}/activate`, {});
  }

  deactivate(id: number): Observable<Operator> {
    return this.httpClient.patch<Operator>(`${this.apiBaseUrl}/users/${id}/deactivate`, {});
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/users/${id}`);
  }
}
