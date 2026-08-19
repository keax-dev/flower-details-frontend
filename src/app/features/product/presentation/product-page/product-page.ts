import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { finalize, forkJoin } from 'rxjs';

import { CategoryApiService } from '../../../category/application/category-api.service';
import { Category } from '../../../category/domain/model/category.model';
import { ProductApiService } from '../../application/product-api.service';
import { PageResponse, Product, ProductPayload } from '../../domain/model/product.model';

interface ApiErrorResponse {
  message?: string;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-product-page',
  imports: [
    HlmCheckboxImports,
    HlmTextareaImports,
    ReactiveFormsModule,
    HlmSelectImports,
    HlmButtonImports,
    HlmLabelImports,
    HlmInputImports,
    RouterLink,
  ],
  templateUrl: './product-page.html',
})
export class ProductPage {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly productApiService = inject(ProductApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly pageResponse = signal<PageResponse<Product> | null>(null);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly pendingDeletion = signal<Product | null>(null);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly isFormVisible = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });
  protected readonly productForm = this.formBuilder.group({
    categoryId: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    active: [true],
  });

  constructor() {
    this.loadInitialData();
  }

  protected openCreateForm(): void {
    this.editingProduct.set(null);
    this.resetForm();
    this.isFormVisible.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.selectedFiles.set([]);
    this.productForm.setValue({
      categoryId: product.category.id,
      title: product.title,
      description: product.description,
      price: product.price,
      active: product.active,
    });
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.editingProduct.set(null);
    this.resetForm();
  }

  protected setCategory(categoryId: number | null | undefined): void {
    this.productForm.controls.categoryId.setValue(categoryId ?? 0);
    this.productForm.controls.categoryId.markAsTouched();
  }

  protected selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles.set(Array.from(input.files ?? []));
  }

  protected submitForm(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSaving.set(true);

    const payload = this.productForm.getRawValue() as ProductPayload;
    const product = this.editingProduct();
    const request$ =
      product === null
        ? this.productApiService.create(payload)
        : this.productApiService.update(product.id, payload);

    request$
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (savedProduct) => this.handleSavedProduct(savedProduct, product === null),
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
      });
  }

  protected requestDeletion(product: Product): void {
    this.pendingDeletion.set(product);
    this.successMessage.set(null);
  }

  protected cancelDeletion(): void {
    this.pendingDeletion.set(null);
  }

  protected deleteProduct(): void {
    const product = this.pendingDeletion();
    if (product === null) {
      return;
    }

    this.errorMessage.set(null);
    this.isDeleting.set(true);
    this.productApiService
      .delete(product.id)
      .pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingDeletion.set(null);
          this.successMessage.set('Producto eliminado correctamente.');
          this.loadProducts(
            this.products().length === 1 ? Math.max(0, this.currentPage() - 1) : this.currentPage(),
          );
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
      });
  }

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.loadProducts(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.loadProducts(this.currentPage() + 1);
    }
  }

  protected hasError(controlName: 'categoryId' | 'title' | 'description' | 'price'): boolean {
    const control = this.productForm.controls[controlName];
    return control.invalid && control.touched;
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  private handleSavedProduct(savedProduct: Product, isNewProduct: boolean): void {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.completeSave(isNewProduct);
      return;
    }

    this.productApiService
      .uploadImages(savedProduct.id, files)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.completeSave(isNewProduct),
        error: (error: unknown) => {
          this.errorMessage.set(
            `El producto fue guardado, pero no se pudieron cargar las imágenes. ${this.resolveErrorMessage(error)}`,
          );
          this.loadProducts(this.currentPage());
        },
      });
  }

  private completeSave(isNewProduct: boolean): void {
    this.successMessage.set(
      isNewProduct ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.',
    );
    this.closeForm();
    this.loadProducts(isNewProduct ? 0 : this.currentPage());
  }

  private loadInitialData(): void {
    this.isLoading.set(true);
    forkJoin({
      categories: this.categoryApiService.list(0, 100),
      products: this.productApiService.listForManagement(0, PAGE_SIZE),
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ categories, products }) => {
          this.categories.set(categories.items);
          this.products.set(products.items);
          this.pageResponse.set(products);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
      });
  }

  private loadProducts(page = 0): void {
    this.isLoading.set(true);
    this.productApiService
      .listForManagement(page, PAGE_SIZE)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.pageResponse.set(response);
        },
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
      });
  }

  private resetForm(): void {
    this.productForm.reset({
      categoryId: 0,
      title: '',
      description: '',
      price: 0,
      active: true,
    });
    this.selectedFiles.set([]);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && this.isApiErrorResponse(error.error)) {
      return error.error.message ?? 'No fue posible completar la operación.';
    }

    return 'No fue posible conectar con el servidor. Inténtalo nuevamente.';
  }

  private isApiErrorResponse(error: unknown): error is ApiErrorResponse {
    return typeof error === 'object' && error !== null && 'message' in error;
  }
}
