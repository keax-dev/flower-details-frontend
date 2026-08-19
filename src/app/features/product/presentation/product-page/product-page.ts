import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryApiService } from '@features/category/infrastructure/http/category-api.service';
import { ProductApiService } from '@features/product/infrastructure/http/product-api.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { ProductList } from '@features/product/presentation/product-list/product-list';
import { Category } from '@features/category/domain/model/category.model';
import { finalize } from 'rxjs';
import { Product } from '@features/product/domain/model/product.model';
import {
  ProductFormSubmission,
  ProductFormDialog,
} from '@features/product/presentation/product-form-dialog/product-form-dialog';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-product-page',
  imports: [HlmButtonImports, ProductFormDialog, ProductList],
  templateUrl: './product-page.html',
})
export class ProductPage implements OnInit {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly productApiService = inject(ProductApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendingDeletion = signal<Product | null>(null);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly pageResponse = signal<PageResponse<Product> | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isDeleting = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly products = signal<Product[]>([]);
  protected readonly isSaving = signal(false);

  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  protected openCreateForm(): void {
    this.editingProduct.set(null);
    this.isFormVisible.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.editingProduct.set(null);
  }

  protected submitForm({ payload, files }: ProductFormSubmission): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.isSaving.set(true);

    const product = this.editingProduct();
    const request$ =
      product === null
        ? this.productApiService.create(payload)
        : this.productApiService.update(product.id, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (savedProduct) => this.handleSavedProduct(savedProduct, product === null, files),
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          resolveApiErrorMessage(error, 'No fue posible completar la operación.'),
        );
      },
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
        error: (error: unknown) =>
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible completar la operación.'),
          ),
      });
  }

  private handleSavedProduct(savedProduct: Product, isNewProduct: boolean, files: File[]): void {
    if (files.length === 0) {
      this.completeSave(isNewProduct);
      return;
    }

    this.productApiService
      .uploadImages(savedProduct.id, files)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.completeSave(isNewProduct),
        error: (error: unknown) => {
          this.errorMessage.set(
            `El producto fue guardado, pero no se pudieron cargar las imágenes. ${resolveApiErrorMessage(error, 'Inténtalo nuevamente.')}`,
          );
          this.loadProducts(this.currentPage());
        },
      });
  }

  private completeSave(isNewProduct: boolean): void {
    this.isSaving.set(false);
    this.successMessage.set(
      isNewProduct ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.',
    );
    this.closeForm();
    this.loadProducts(isNewProduct ? 0 : this.currentPage());
  }

  private loadCategories(): void {
    this.categoryApiService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error: unknown) =>
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible cargar las categorías.'),
          ),
      });
  }

  protected loadProducts(page = 0): void {
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
        error: (error: unknown) =>
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible cargar los productos.'),
          ),
      });
  }
}
