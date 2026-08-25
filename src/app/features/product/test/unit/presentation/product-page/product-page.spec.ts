import { TestBed } from '@angular/core/testing';
import { Product } from '@features/product/models/product.model';
import { ProductPage } from '@features/product/presentation/product-page/product-page';

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

describe('ProductPage', () => {
  it('opens the form for a new product', async () => {
    await TestBed.configureTestingModule({ imports: [ProductPage] }).compileComponents();
    const component = TestBed.createComponent(ProductPage).componentInstance;

    component['openCreateForm']();

    expect(component['editingProduct']()).toBeNull();
    expect(component['isFormVisible']()).toBe(true);
  });

  it('refreshes the list and opens image management after creating a product', async () => {
    await TestBed.configureTestingModule({ imports: [ProductPage] }).compileComponents();
    const component = TestBed.createComponent(ProductPage).componentInstance;

    component['openCreateForm']();
    component['handleProductSaved'](PRODUCT);

    expect(component['editingProduct']()).toBeNull();
    expect(component['isFormVisible']()).toBe(false);
    expect(component['listRefreshVersion']()).toBe(1);
    expect(component['imageProduct']()).toBe(PRODUCT);
    expect(component['isImageManagerVisible']()).toBe(true);
  });
});
