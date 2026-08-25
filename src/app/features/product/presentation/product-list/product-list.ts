import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Product } from '@features/product/models/product.model';
import { ProductApiService } from '@features/product/services/product-api.service';
import {
  faArrowLeft,
  faArrowRight,
  faImages,
  faPen,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { NotificationService } from '@core/notification/notification.service';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { finalize } from 'rxjs';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-product-list',
  imports: [NzPopconfirmModule, FontAwesomeModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private readonly currencyFormatter = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  });
  private readonly productApiService = inject(ProductApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly refreshVersion = input(0);
  readonly edit = output<Product>();
  readonly manageImages = output<Product>();

  protected readonly products = signal<Product[]>([]);
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

  constructor() {
    effect(() => {
      this.refreshVersion();
      this.loadProducts();
    });
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
          this.loadProducts(
            this.products().length === 1 ? Math.max(0, this.currentPage() - 1) : this.currentPage(),
          );
        },
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible eliminar el producto.'),
          ),
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
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible cargar los productos.'),
          ),
      });
  }
}
