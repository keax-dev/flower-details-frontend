import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight, faCartPlus, faFilter, faRotateLeft, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';

import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { AuthService } from '@features/auth/application/auth.service';
import { CartApiService } from '@features/cart/services/cart-api.service';
import { Category } from '@features/category/models/category.model';
import { CategoryApiService } from '@features/category/services/category-api.service';
import { CatalogFilters } from '@features/catalog/models/catalog-filters.model';
import { CatalogApiService } from '@features/catalog/services/catalog-api.service';
import { Product } from '@features/product/models/product.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { validatePriceRange } from '@shared/validation/range-validators';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-catalog-page',
  imports: [CurrencyPipe, FontAwesomeModule, NgOptimizedImage, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.css',
})
export class CatalogPage {
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faCartPlus = faCartPlus;
  protected readonly faFilter = faFilter;
  protected readonly faRotateLeft = faRotateLeft;
  protected readonly faRotateRight = faRotateRight;
  private readonly catalogApi = inject(CatalogApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly cartApi = inject(CartApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private listSubscription?: Subscription;
  private appliedFilters: CatalogFilters = {};
  private requestedPage = 0;

  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly products = signal<readonly Product[]>([]);
  protected readonly pageResponse = signal<PageResponse<Product> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly categoryError = signal(false);
  protected readonly addingProductIds = signal<ReadonlySet<number>>(new Set());
  protected readonly invalidQuantityProductIds = signal<ReadonlySet<number>>(new Set());
  protected readonly user = this.authService.user;
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const response = this.pageResponse();
    return response !== null && response.page + 1 < response.totalPages;
  });
  protected readonly filterForm = this.formBuilder.group(
    {
      q: ['', [Validators.maxLength(120)]],
      categoryId: [''],
      minPrice: [null as number | null, [Validators.min(0)]],
      maxPrice: [null as number | null, [Validators.min(0)]],
      sortBy: ['createdAt' as 'createdAt' | 'title' | 'price'],
      direction: ['desc' as 'asc' | 'desc'],
    },
    { validators: validatePriceRange },
  );

  constructor() {
    this.loadCategories();
    this.loadProducts();
  }

  protected applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const value = this.filterForm.getRawValue();
    this.appliedFilters = {
      ...(value.q.trim() && { q: value.q.trim() }),
      ...(value.categoryId && { categoryId: Number(value.categoryId) }),
      ...(value.minPrice !== null && { minPrice: value.minPrice }),
      ...(value.maxPrice !== null && { maxPrice: value.maxPrice }),
      sortBy: value.sortBy,
      direction: value.direction,
    };
    this.loadProducts();
  }

  protected clearFilters(): void {
    this.filterForm.reset({ q: '', categoryId: '', minPrice: null, maxPrice: null, sortBy: 'createdAt', direction: 'desc' });
    this.appliedFilters = {};
    this.loadProducts();
  }

  protected previousPage(): void {
    if (this.hasPreviousPage() && !this.isLoading()) {
      this.loadProducts(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage() && !this.isLoading()) {
      this.loadProducts(this.currentPage() + 1);
    }
  }

  protected retry(): void {
    this.loadProducts(this.requestedPage);
  }

  protected retryCategories(): void {
    this.loadCategories();
  }

  protected addToCart(product: Product, quantityInput: HTMLInputElement): void {
    if (this.user()?.role !== 'CUSTOMER' || this.addingProductIds().has(product.id)) return;

    const quantity = quantityInput.valueAsNumber;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      this.setInvalidQuantity(product.id, true);
      quantityInput.focus();
      return;
    }

    this.setInvalidQuantity(product.id, false);
    this.setAddingProduct(product.id, true);
    this.cartApi
      .add(product.id, quantity)
      .pipe(
        finalize(() => this.setAddingProduct(product.id, false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.notificationService.success(`${product.title} se agregó al carrito.`),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible agregar el producto al carrito.')),
      });
  }

  protected clearQuantityError(productId: number): void {
    this.setInvalidQuantity(productId, false);
  }

  private loadCategories(): void {
    this.categoryError.set(false);
    this.categoryApi
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categoryError.set(true),
      });
  }

  private setAddingProduct(productId: number, isAdding: boolean): void {
    this.addingProductIds.update((currentIds) => {
      const nextIds = new Set(currentIds);
      if (isAdding) nextIds.add(productId);
      else nextIds.delete(productId);
      return nextIds;
    });
  }

  private setInvalidQuantity(productId: number, isInvalid: boolean): void {
    this.invalidQuantityProductIds.update((currentIds) => {
      const nextIds = new Set(currentIds);
      if (isInvalid) nextIds.add(productId);
      else nextIds.delete(productId);
      return nextIds;
    });
  }

  private loadProducts(page = 0): void {
    this.listSubscription?.unsubscribe();
    this.requestedPage = page;
    this.products.set([]);
    this.pageResponse.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(true);
    this.listSubscription = this.catalogApi
      .list(page, PAGE_SIZE, this.appliedFilters)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.pageResponse.set(response);
        },
        error: () => this.errorMessage.set('No fue posible cargar el catálogo. Inténtalo nuevamente.'),
      });
  }
}
