import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Cart } from '@features/cart/models/cart.model';
import { CartApiService } from '@features/cart/services/cart-api.service';

const CART: Cart = { id: 1, items: [], total: 0 };

describe('CartApiService', () => {
  let service: CartApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CartApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the customer cart', () => {
    service.get().subscribe((cart) => expect(cart).toEqual(CART));
    const request = http.expectOne('/api/cart');
    expect(request.request.method).toBe('GET');
    request.flush(CART);
  });

  it('adds a product with its quantity', () => {
    service.add(7, 2).subscribe();
    const request = http.expectOne('/api/cart/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ productId: 7, quantity: 2 });
    request.flush(CART);
  });

  it('updates an existing item quantity', () => {
    service.updateQuantity(3, 4).subscribe();
    const request = http.expectOne('/api/cart/items/3');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ quantity: 4 });
    request.flush(CART);
  });

  it('removes one item or clears all items', () => {
    service.remove(3).subscribe();
    const remove = http.expectOne('/api/cart/items/3');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);

    service.clear().subscribe();
    const clear = http.expectOne('/api/cart/items');
    expect(clear.request.method).toBe('DELETE');
    clear.flush(null);
  });
});
