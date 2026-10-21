import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/config/api.config';
import { Cart } from '@features/cart/models/cart.model';

@Service()
export class CartApiService {
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly httpClient = inject(HttpClient);
  private readonly cartUrl = `${this.apiBaseUrl}/cart`;

  get(): Observable<Cart> {
    return this.httpClient.get<Cart>(this.cartUrl);
  }

  add(productId: number, quantity: number): Observable<Cart> {
    return this.httpClient.post<Cart>(`${this.cartUrl}/items`, { productId, quantity });
  }

  updateQuantity(itemId: number, quantity: number): Observable<Cart> {
    return this.httpClient.put<Cart>(`${this.cartUrl}/items/${itemId}`, { quantity });
  }

  remove(itemId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.cartUrl}/items/${itemId}`);
  }

  clear(): Observable<void> {
    return this.httpClient.delete<void>(`${this.cartUrl}/items`);
  }
}
