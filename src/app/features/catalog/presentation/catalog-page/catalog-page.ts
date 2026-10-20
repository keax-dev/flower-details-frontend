import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { Category } from '@features/category/models/category.model';
import { CategoryApiService } from '@features/category/services/category-api.service';
import { CatalogFilters } from '@features/catalog/models/catalog-filters.model';
import { CatalogApiService } from '@features/catalog/services/catalog-api.service';
import { Product } from '@features/product/models/product.model';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const PAGE_SIZE = 12;

function validatePriceRange(control: AbstractControl): ValidationErrors | null {
  const minPrice: unknown = control.get('minPrice')?.value;
  const maxPrice: unknown = control.get('maxPrice')?.value;
  return typeof minPrice === 'number' && typeof maxPrice === 'number' && minPrice > maxPrice ? { priceRange: true } : null;
}

@Component({
  selector: 'app-catalog-page',
  imports: [CurrencyPipe, NgOptimizedImage, ReactiveFormsModule, RouterLink],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.css',
})
export class CatalogPage {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly categoryApi = inject(CategoryApiService);
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
