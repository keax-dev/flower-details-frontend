import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CategoryApiService } from '@app/features/category/services/category-api.service';
import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ProductPayload } from '@features/product/models/product-payload.model';
import { Product } from '@features/product/models/product.model';
import { ProductCategory } from '@features/product/models/product-category.model';
import { ProductApiService } from '@features/product/services/product-api.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    NzCheckboxModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
    FontAwesomeModule,
    ReactiveFormsModule,
  ],
  templateUrl: './product-form-dialog.html',
})
export class ProductFormDialog {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly productApiService = inject(ProductApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly product = input<Product | null>(null);
  readonly isOpen = input(false);

  readonly closed = output<void>();
  readonly saved = output<Product>();

  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly isSaving = signal(false);
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faXmark = faXmark;
  protected readonly productForm = this.formBuilder.group({
    categoryId: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    active: [true],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.populateForm(this.product());
        this.loadCategories(this.product());
      }
    });
  }

  protected submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const product = this.product();
    const payload: ProductPayload = this.productForm.getRawValue();
    const request$ =
      product === null
        ? this.productApiService.create(payload)
        : this.productApiService.update(product.id, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (savedProduct) => this.completeSave(savedProduct, product === null),
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.notificationService.error(
          resolveApiErrorMessage(error, 'No fue posible guardar el producto.'),
        );
      },
    });
  }

  protected hasError(controlName: 'categoryId' | 'title' | 'description' | 'price'): boolean {
    const control = this.productForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private completeSave(product: Product, isNewProduct: boolean): void {
    this.isSaving.set(false);
    this.notificationService.success(
      isNewProduct ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.',
    );
    this.saved.emit(product);
  }

  private loadCategories(product: Product | null): void {
    this.categoryApiService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(this.includeCurrentCategory(categories, product)),
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible cargar las categorías.'),
          ),
      });
  }

  private includeCurrentCategory(
    categories: readonly ProductCategory[],
    product: Product | null,
  ): ProductCategory[] {
    if (product === null || categories.some((category) => category.id === product.category.id)) {
      return [...categories];
    }
    return [product.category, ...categories];
  }

  private populateForm(product: Product | null): void {
    this.productForm.reset(
      product === null
        ? { categoryId: 0, title: '', description: '', price: 0, active: true }
        : {
            categoryId: product.category.id,
            title: product.title,
            description: product.description,
            price: product.price,
            active: product.active,
          },
    );
  }
}
