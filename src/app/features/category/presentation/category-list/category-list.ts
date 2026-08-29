import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { faArrowLeft, faArrowRight, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
import { finalize } from 'rxjs';

import { Category } from '@app/features/category/models/category.model';
import { CategoryApiService } from '@app/features/category/services/category-api.service';
import { NotificationService } from '@core/notification/notification.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { PageResponse } from '@shared/domain/pagination/page-response.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-category-list',
  imports: [NzPopconfirmModule, FontAwesomeModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly refreshVersion = input(0);
  readonly edit = output<Category>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faTrash = faTrash;
  protected readonly faPen = faPen;
  protected readonly pageResponse = signal<PageResponse<Category> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);
  protected readonly hasPreviousPage = computed(() => this.currentPage() > 0);
  protected readonly hasNextPage = computed(() => {
    const page = this.pageResponse();
    return page !== null && page.page + 1 < page.totalPages;
  });

  constructor() {
    effect(() => {
      this.refreshVersion();
      this.loadCategories();
    });
  }

  protected deleteCategory(category: Category): void {
    this.isDeleting.set(true);
    this.categoryApiService
      .delete(category.id)
      .pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Categoría eliminada correctamente.');
          this.loadCategories(
            this.categories().length === 1
              ? Math.max(0, this.currentPage() - 1)
              : this.currentPage(),
          );
        },
        error: (error: unknown) =>
          this.notificationService.errorApi(
            resolveApiErrorMessage(error, 'No fue posible eliminar la categoría.'),
          ),
      });
  }

  protected previousPage(): void {
    if (this.hasPreviousPage()) {
      this.loadCategories(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.hasNextPage()) {
      this.loadCategories(this.currentPage() + 1);
    }
  }

  private loadCategories(page = 0): void {
    this.isLoading.set(true);
    this.categoryApiService
      .listForAdministration(page, PAGE_SIZE)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.categories.set(response.items);
          this.pageResponse.set(response);
        },
        error: (error: unknown) =>
          this.notificationService.errorApi(
            resolveApiErrorMessage(error, 'No fue posible cargar las categorías.'),
          ),
      });
  }
}
