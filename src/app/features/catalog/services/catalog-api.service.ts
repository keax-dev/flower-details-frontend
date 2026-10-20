import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/config/api.config';
import { CatalogFilters } from '@features/catalog/models/catalog-filters.model';
import { Product } from '@features/product/models/product.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

@Service()
export class CatalogApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  list(page: number, size: number, filters: CatalogFilters = {}): Observable<PageResponse<Product>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.categoryId !== undefined) params = params.set('categoryId', filters.categoryId);
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.direction) params = params.set('direction', filters.direction);
    return this.httpClient.get<PageResponse<Product>>(`${this.apiBaseUrl}/products`, { params });
  }

  getById(id: number): Observable<Product> {
    return this.httpClient.get<Product>(`${this.apiBaseUrl}/products/${id}`);
  }
}
