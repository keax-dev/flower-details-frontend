import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Category } from '@features/category/models/category.model';
import { CategoryApiService } from '@features/category/services/category-api.service';

const CATEGORY = category(1, 'Cumpleaños');

describe('CategoryApiService', () => {
  let categoryApiService: CategoryApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    categoryApiService = TestBed.inject(CategoryApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests a paginated administrative category list', () => {
    categoryApiService.listForAdministration(2, 10).subscribe();

    const request = httpTestingController.expectOne('/api/categories/administration?page=2&size=10');
    expect(request.request.method).toBe('GET');
    request.flush(page([CATEGORY]));
  });

  it('retrieves every category page for product selection', () => {
    let categories: Category[] = [];

    categoryApiService.listAll().subscribe((response) => (categories = response));

    httpTestingController
      .expectOne('/api/categories?page=0&size=100')
      .flush(page([CATEGORY], 0, 2));
    httpTestingController
      .expectOne('/api/categories?page=1&size=100')
      .flush(page([category(2, 'Aniversarios')], 1, 2));

    expect(categories.map((item) => item.title)).toEqual(['Cumpleaños', 'Aniversarios']);
  });

  it('creates a category with its payload', () => {
    const payload = { title: 'Regalos', description: 'Detalles para regalar', active: true };
    categoryApiService.create(payload).subscribe();

    const request = httpTestingController.expectOne('/api/categories');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(CATEGORY);
  });

  it('updates a category with its payload', () => {
    const payload = { title: 'Regalos', description: 'Detalles para regalar', active: false };
    categoryApiService.update(CATEGORY.id, payload).subscribe();

    const request = httpTestingController.expectOne('/api/categories/1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ ...CATEGORY, ...payload });
  });

  it('deletes a category by identifier', () => {
    categoryApiService.delete(CATEGORY.id).subscribe();

    const request = httpTestingController.expectOne('/api/categories/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});

function category(id: number, title: string): Category {
  return {
    id,
    title,
    description: 'Arreglos para celebrar',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function page(items: Category[], currentPage = 0, totalPages = 1) {
  return {
    items,
    page: currentPage,
    size: 100,
    totalElements: items.length,
    totalPages,
  };
}
