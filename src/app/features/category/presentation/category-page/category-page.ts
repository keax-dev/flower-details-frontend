import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { finalize } from 'rxjs';

import { CategoryApiService } from '../../application/category-api.service';
import { Category, PageResponse } from '../../domain/model/category.model';

interface ApiErrorResponse {
  message?: string;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-category-page',
  imports: [
    HlmButtonImports,
    HlmCheckboxImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTextareaImports,
    BrnDialogImports,
    ReactiveFormsModule,
  ],
  templateUrl: './category-page.html',
})
export class CategoryPage {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = signal<Category[]>([]);
  protected readonly pageResponse = signal<PageResponse<Category> | null>(null);
  protected readonly editingCategory = signal<Category | null>(null);
  protected readonly pendingDeletion = signal<Category | null>(null);
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
  protected readonly categoryForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    active: [true],
  });

  constructor() {
    this.loadCategories();
  }

  protected openCreateForm(): void {
    this.editingCategory.set(null);
    this.resetForm();
    this.isFormVisible.set(true);
  }

  protected openEditForm(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.setValue({
      title: category.title,
      description: category.description,
      active: category.active,
    });
    this.isFormVisible.set(true);
  }

  protected closeForm(): void {
    this.isFormVisible.set(false);
    this.editingCategory.set(null);
    this.resetForm();
  }

  protected submitForm(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSaving.set(true);

    const payload = this.categoryForm.getRawValue();
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
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
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
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
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

  protected hasError(controlName: 'title' | 'description'): boolean {
    const control = this.categoryForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private loadCategories(page = 0): void {
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
        error: (error: unknown) => this.errorMessage.set(this.resolveErrorMessage(error)),
      });
  }

  private resetForm(): void {
    this.categoryForm.reset({ title: '', description: '', active: true });
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
