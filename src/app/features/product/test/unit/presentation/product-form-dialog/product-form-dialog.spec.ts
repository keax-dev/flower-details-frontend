import { TestBed } from '@angular/core/testing';
import { CategoryApiService } from '@features/category/services/category-api.service';
import { Product } from '@features/product/models/product.model';
import { ProductFormDialog } from '@features/product/presentation/product-form-dialog/product-form-dialog';
import { ProductApiService } from '@features/product/services/product-api.service';
import { NotificationService } from '@core/notification/notification.service';
import { of } from 'rxjs';

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

async function createComponent(activeCategories = [PRODUCT.category]) {
  const categoryApiService = { listAll: vi.fn(() => of(activeCategories)) };
  const productApiService = {
    create: vi.fn(() => of(PRODUCT)),
    update: vi.fn(() => of(PRODUCT)),
  };
  const notificationService = { success: vi.fn(), error: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [ProductFormDialog],
    providers: [
      { provide: CategoryApiService, useValue: categoryApiService },
      { provide: ProductApiService, useValue: productApiService },
      { provide: NotificationService, useValue: notificationService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductFormDialog);
  return { fixture, productApiService, notificationService };
}

describe('ProductFormDialog', () => {
  it('resets the metadata form each time a create dialog is opened', async () => {
    const { fixture } = await createComponent();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const form = fixture.componentInstance['productForm'];
    form.controls.title.setValue('Ramo de rosas');

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(form.getRawValue()).toEqual({
      categoryId: 0,
      title: '',
      description: '',
      price: 0,
      active: true,
    });
  });

  it('does not submit an invalid form', async () => {
    const { fixture, productApiService } = await createComponent();

    fixture.componentInstance['submit']();

    expect(productApiService.create).not.toHaveBeenCalled();
    expect(fixture.componentInstance['productForm'].touched).toBe(true);
  });

  it('keeps the current inactive category available while editing', async () => {
    const { fixture } = await createComponent([]);
    fixture.componentRef.setInput('product', PRODUCT);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(fixture.componentInstance['categories']()).toEqual([PRODUCT.category]);
  });

  it('creates a product and emits it for image management', async () => {
    const { fixture, productApiService, notificationService } = await createComponent();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance['productForm'].setValue({
      categoryId: 2,
      title: PRODUCT.title,
      description: PRODUCT.description,
      price: PRODUCT.price,
      active: true,
    });

    fixture.componentInstance['submit']();

    expect(productApiService.create).toHaveBeenCalledOnce();
    expect(notificationService.success).toHaveBeenCalledWith('Producto creado correctamente.');
    expect(saved).toHaveBeenCalledWith(PRODUCT);
  });
});
