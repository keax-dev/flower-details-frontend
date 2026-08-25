import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { Category } from '@app/features/category/models/category.model';
import { CategoryApiService } from '@app/features/category/services/category-api.service';
import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { ProductPayload } from '@features/product/models/product-payload.model';
import { Product } from '@features/product/models/product.model';
import { ProductApiService } from '@features/product/services/product-api.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    NzCheckboxModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
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
  readonly saved = output<void>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly isSaving = signal(false);
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
        this.loadCategories();
      }
    });
  }

  protected selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles.set(Array.from(input.files ?? []));
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
      next: (savedProduct) => this.uploadImages(savedProduct, product === null),
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

  private uploadImages(product: Product, isNewProduct: boolean): void {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.completeSave(isNewProduct);
      return;
    }

    this.productApiService
      .uploadImages(product.id, files)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.completeSave(isNewProduct),
        error: (error: unknown) => {
          this.notificationService.warning(
            `El producto fue guardado, pero no se pudieron cargar las imágenes. ${resolveApiErrorMessage(error, 'Inténtalo nuevamente.')}`,
          );
          this.saved.emit();
        },
      });
  }

  private completeSave(isNewProduct: boolean): void {
    this.isSaving.set(false);
    this.notificationService.success(
      isNewProduct ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.',
    );
    this.saved.emit();
  }

  private loadCategories(): void {
    this.categoryApiService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible cargar las categorías.'),
          ),
      });
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
    this.selectedFiles.set([]);
  }
}
