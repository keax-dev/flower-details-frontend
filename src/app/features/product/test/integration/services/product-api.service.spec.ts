import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Product } from '@features/product/models/product.model';
import { ProductApiService } from '@features/product/services/product-api.service';

const PRODUCT: Product = {
  id: 1,
  category: { id: 2, title: 'Cumpleaños' },
  title: 'Ramo de rosas',
  description: 'Docena de rosas rojas',
  price: 25,
  active: true,
  images: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('ProductApiService', () => {
  let productApiService: ProductApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    productApiService = TestBed.inject(ProductApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests the paginated management product list', () => {
    productApiService.listForManagement(1, 10).subscribe();

    const request = httpTestingController.expectOne('/api/products/manage?page=1&size=10');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [PRODUCT], page: 1, size: 10, totalElements: 11, totalPages: 2 });
  });

  it('creates and updates products with their payloads', () => {
    const payload = {
      categoryId: 2,
      title: PRODUCT.title,
      description: PRODUCT.description,
      price: PRODUCT.price,
      active: true,
    };

    productApiService.create(payload).subscribe();
    const createRequest = httpTestingController.expectOne('/api/products');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(payload);
    createRequest.flush(PRODUCT);

    productApiService.update(PRODUCT.id, { ...payload, active: false }).subscribe();
    const updateRequest = httpTestingController.expectOne('/api/products/1');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({ ...payload, active: false });
    updateRequest.flush({ ...PRODUCT, active: false });
  });

  it('uploads every selected image as multipart form data', () => {
    const firstImage = new File(['first'], 'first.png', { type: 'image/png' });
    const secondImage = new File(['second'], 'second.webp', { type: 'image/webp' });

    productApiService.uploadImages(PRODUCT.id, [firstImage, secondImage]).subscribe();

    const request = httpTestingController.expectOne('/api/products/1/images');
    const body = request.request.body as FormData;
    expect(request.request.method).toBe('POST');
    expect(body.getAll('images')).toEqual([firstImage, secondImage]);
    request.flush(PRODUCT);
  });

  it('updates image positions and deletes a product image', () => {
    const positions = [
      { imageId: 5, sortOrder: 0 },
      { imageId: 4, sortOrder: 1 },
    ];

    productApiService.updateImagePositions(PRODUCT.id, positions).subscribe();
    const positionsRequest = httpTestingController.expectOne('/api/products/1/images/positions');
    expect(positionsRequest.request.method).toBe('PUT');
    expect(positionsRequest.request.body).toEqual({ positions });
    positionsRequest.flush(PRODUCT);

    productApiService.deleteImage(PRODUCT.id, 4).subscribe();
    const deleteImageRequest = httpTestingController.expectOne('/api/products/1/images/4');
    expect(deleteImageRequest.request.method).toBe('DELETE');
    deleteImageRequest.flush(PRODUCT);
  });

  it('deletes a product by identifier', () => {
    productApiService.delete(PRODUCT.id).subscribe();

    const request = httpTestingController.expectOne('/api/products/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
