import { API_BASE_URL } from '../../../core/http/api.config';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { Category, CategoryPayload, PageResponse } from '../domain/model/category.model';

@Service()
export class CategoryApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  list(page: number, size: number): Observable<PageResponse<Category>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<PageResponse<Category>>(`${this.apiBaseUrl}/categories`, { params });
  }

  create(payload: CategoryPayload): Observable<Category> {
    return this.httpClient.post<Category>(`${this.apiBaseUrl}/categories`, payload);
  }

  update(id: number, payload: CategoryPayload): Observable<Category> {
    return this.httpClient.put<Category>(`${this.apiBaseUrl}/categories/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/categories/${id}`);
  }
}
