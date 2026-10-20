import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { Product } from '@features/product/models/product.model';
import { ProductManagementFilters } from '@features/product/models/product-management-filters.model';
import { ProductApiService } from '@features/product/services/product-api.service';
import { faArrowLeft, faArrowRight, faImages, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { finalize, Subscription } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Category } from '@app/features/category/models/category.model';
import { CategoryApiService } from '@app/features/category/services/category-api.service';

const PAGE_SIZE = 10;

function validatePriceRange(control: AbstractControl): ValidationErrors | null {
  const minPrice: unknown = control.get('minPrice')?.value;
  const maxPrice: unknown = control.get('maxPrice')?.value;
  return typeof minPrice === 'number' && typeof maxPrice === 'number' && minPrice > maxPrice ? { priceRange: true } : null;
}

@Component({
  selector: 'app-product-list',
  imports: [NzPopconfirmModule, FontAwesomeModule, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private readonly currencyFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  });
  private readonly productApiService = inject(ProductApiService);
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private listSubscription?: Subscription;
  private filters: ProductManagementFilters = {};

  readonly refreshVersion = input(0);
  readonly edit = output<Product>();
  readonly manageImages = output<Product>();

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly pageResponse = signal<PageResponse<Product> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faImages = faImages;
  protected readonly faTrash = faTrash;
  protected readonly faPen = faPen;
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });
  protected readonly filterForm = this.formBuilder.group(
    {
      q: ['', [Validators.maxLength(120)]],
      categoryId: [''],
      minPrice: [null as number | null, [Validators.min(0)]],
      maxPrice: [null as number | null, [Validators.min(0)]],
      active: [''],
      sortBy: ['createdAt' as 'createdAt' | 'title' | 'price'],
      direction: ['desc' as 'asc' | 'desc'],
    },
    { validators: validatePriceRange },
  );

  constructor() {
    this.categoryApiService
      .listAllForAdministration()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar las categorías.')),
      });
    effect(() => {
      this.refreshVersion();
      this.loadProducts();
    });
  }

  protected applyFilters(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    const value = this.filterForm.getRawValue();
    this.filters = {
      ...(value.q.trim() && { q: value.q.trim() }),
      ...(value.categoryId && { categoryId: Number(value.categoryId) }),
      ...(value.minPrice !== null && { minPrice: value.minPrice }),
      ...(value.maxPrice !== null && { maxPrice: value.maxPrice }),
      ...(value.active && { active: value.active === 'true' }),
      sortBy: value.sortBy,
      direction: value.direction,
    };
    this.loadProducts();
  }

  protected clearFilters(): void {
    this.filterForm.reset({ q: '', categoryId: '', minPrice: null, maxPrice: null, active: '', sortBy: 'createdAt', direction: 'desc' });
    this.filters = {};
    this.loadProducts();
  }

  protected deleteProduct(product: Product): void {
    this.isDeleting.set(true);
    this.productApiService
      .delete(product.id)
      .pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Producto eliminado correctamente.');
          this.loadProducts(this.products().length === 1 ? Math.max(0, this.currentPage() - 1) : this.currentPage());
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible eliminar el producto.')),
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

  protected formatPrice(price: number): string {
    return this.currencyFormatter.format(price);
  }

  private loadProducts(page = 0): void {
    this.listSubscription?.unsubscribe();
    this.isLoading.set(true);
    this.listSubscription = this.productApiService
      .listForManagement(page, PAGE_SIZE, this.filters)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
          this.pageResponse.set(response);
        },
        error: (error: unknown) => this.notificationService.errorApi(resolveApiErrorMessage(error, 'No fue posible cargar los productos.')),
      });
  }
}
