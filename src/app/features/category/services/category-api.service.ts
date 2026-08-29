import { EMPTY, expand, Observable, reduce } from 'rxjs';

import { Category } from '@app/features/category/models/category.model';
import { CategoryPayload } from '@app/features/category/models/category-payload.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { API_BASE_URL } from '@core/http/config/api.config';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const MAX_PAGE_SIZE = 100;

@Service()
export class CategoryApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  listForAdministration(page: number, size: number): Observable<PageResponse<Category>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<PageResponse<Category>>(`${this.apiBaseUrl}/categories/administration`, {
      params,
    });
  }

  listAll(): Observable<Category[]> {
    return this.listActive(0, MAX_PAGE_SIZE).pipe(
      expand((response) => (response.page + 1 < response.totalPages ? this.listActive(response.page + 1, MAX_PAGE_SIZE) : EMPTY)),
      reduce((categories: Category[], response) => [...categories, ...response.items], []),
    );
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

  private listActive(page: number, size: number): Observable<PageResponse<Category>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<PageResponse<Category>>(`${this.apiBaseUrl}/categories`, { params });
  }
}
