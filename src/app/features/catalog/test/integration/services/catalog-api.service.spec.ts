import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CatalogApiService } from '@features/catalog/services/catalog-api.service';
import { Product } from '@features/product/models/product.model';

const PRODUCT: Product = {
  id: 1,
  category: { id: 2, title: 'Rosas' },
  title: 'Ramo de rosas',
  description: '<p>Doce rosas rojas</p>',
  price: 25,
  active: true,
  images: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('CatalogApiService', () => {
  let service: CatalogApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CatalogApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the public product list with pagination and filters', () => {
    service.list(1, 12, { q: 'rosas', categoryId: 2, minPrice: 0, maxPrice: 50, sortBy: 'price', direction: 'asc' }).subscribe();

    const request = http.expectOne('/api/products?page=1&size=12&q=rosas&categoryId=2&minPrice=0&maxPrice=50&sortBy=price&direction=asc');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [PRODUCT], page: 1, size: 12, totalElements: 13, totalPages: 2 });
  });

  it('requests a public product detail', () => {
    service.getById(1).subscribe((product) => expect(product).toEqual(PRODUCT));

    const request = http.expectOne('/api/products/1');
    expect(request.request.method).toBe('GET');
    request.flush(PRODUCT);
  });
});
