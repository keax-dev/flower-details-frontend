import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Category, CategoryPayload } from '@features/category/domain/model/category.model';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryApiService } from '@features/category/infrastructure/http/category-api.service';
import { CategoryFormDialog } from '@features/category/presentation/category-form-dialog/category-form-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { PageResponse } from '@shared/domain/pagination/page-response.model';
import { CategoryList } from '@features/category/presentation/category-list/category-list';
import { finalize } from 'rxjs';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-category-page',
  imports: [HlmButtonImports, CategoryFormDialog, CategoryList],
  templateUrl: './category-page.html',
})
export class CategoryPage implements OnInit {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly editingCategory = signal<Category | null>(null);
  protected readonly pendingDeletion = signal<Category | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isFormVisible = signal(false);
  protected readonly pageResponse = signal<PageResponse<Category> | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly isDeleting = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly currentPage = computed(() => this.pageResponse()?.page ?? 0);

  ngOnInit() {
    this.loadCategories();
  }

  protected openCreateForm(): void {
    this.editingCategory.set(null);
    this.isFormVisible.set(true);
  }

  protected openEditForm(category: Category): void {
    this.editingCategory.set(category);
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.editingCategory.set(null);
  }

  protected submitForm(payload: CategoryPayload): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.isSaving.set(true);

    const category = this.editingCategory();

    const request$ =
      category === null
        ? this.categoryApiService.create(payload)
        : this.categoryApiService.update(category.id, payload);

    request$
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            category === null
              ? 'Categoría creada correctamente.'
              : 'Categoría actualizada correctamente.',
          );
          this.closeForm();
          this.loadCategories(category === null ? 0 : this.currentPage());
        },
        error: (error: unknown) =>
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible completar la operación.'),
          ),
      });
  }

  protected requestDeletion(category: Category): void {
    this.pendingDeletion.set(category);
    this.successMessage.set(null);
  }

  protected cancelDeletion(): void {
    this.pendingDeletion.set(null);
  }

  protected deleteCategory(): void {
    const category = this.pendingDeletion();
    if (category === null) {
      return;
    }

    this.errorMessage.set(null);
    this.isDeleting.set(true);

    this.categoryApiService
      .delete(category.id)
      .pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.pendingDeletion.set(null);
          this.successMessage.set('Categoría eliminada correctamente.');
          this.loadCategories(
            this.categories().length === 1
              ? Math.max(0, this.currentPage() - 1)
              : this.currentPage(),
          );
        },
        error: (error: unknown) =>
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible completar la operación.'),
          ),
      });
  }

  protected loadCategories(page = 0): void {
    this.isLoading.set(true);
    this.categoryApiService
      .list(page, PAGE_SIZE)
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
          this.errorMessage.set(
            resolveApiErrorMessage(error, 'No fue posible conectar con el servidor.'),
          ),
      });
  }
}
