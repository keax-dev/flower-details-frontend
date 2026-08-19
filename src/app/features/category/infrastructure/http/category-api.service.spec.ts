import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoryApiService } from './category-api.service';

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

  it('retrieves every category page for product selection', () => {
    let categories: { id: number; title: string }[] = [];

    categoryApiService.listAll().subscribe((response) => (categories = response));

    httpTestingController.expectOne('/api/categories?page=0&size=100').flush({
      items: [category(1, 'Cumpleaños')],
      page: 0,
      size: 100,
      totalElements: 101,
      totalPages: 2,
    });
    httpTestingController.expectOne('/api/categories?page=1&size=100').flush({
      items: [category(2, 'Aniversarios')],
      page: 1,
      size: 100,
      totalElements: 101,
      totalPages: 2,
    });

    expect(categories.map((item) => item.title)).toEqual(['Cumpleaños', 'Aniversarios']);
  });
});

function category(id: number, title: string) {
  return {
    id,
    title,
    description: '',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}
