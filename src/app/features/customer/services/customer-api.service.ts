import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/http/config/api.config';
import { Customer } from '@features/customer/models/customer.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

@Service()
export class CustomerApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  list(page: number, size: number): Observable<PageResponse<Customer>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<PageResponse<Customer>>(`${this.apiBaseUrl}/users/customers`, { params });
  }

  activate(id: number): Observable<Customer> {
    return this.httpClient.patch<Customer>(`${this.apiBaseUrl}/users/${id}/activate`, {});
  }

  deactivate(id: number): Observable<Customer> {
    return this.httpClient.patch<Customer>(`${this.apiBaseUrl}/users/${id}/deactivate`, {});
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/users/${id}`);
  }
}
