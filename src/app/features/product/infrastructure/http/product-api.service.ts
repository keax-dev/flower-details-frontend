import { Product, ProductPayload } from '@features/product/domain/model/product.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { API_BASE_URL } from '@core/http/config/api.config';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

@Service()
export class ProductApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);

  listForManagement(page: number, size: number): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.httpClient.get<PageResponse<Product>>(`${this.apiBaseUrl}/products/manage`, {
      params,
    });
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.httpClient.post<Product>(`${this.apiBaseUrl}/products`, payload);
  }

  update(id: number, payload: ProductPayload): Observable<Product> {
    return this.httpClient.put<Product>(`${this.apiBaseUrl}/products/${id}`, payload);
  }

  uploadImages(id: number, files: File[]): Observable<Product> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return this.httpClient.post<Product>(`${this.apiBaseUrl}/products/${id}/images`, formData);
  }

  delete(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiBaseUrl}/products/${id}`);
  }
}
