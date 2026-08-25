import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Category } from '@app/features/category/models/category.model';
import { CategoryPayload } from '@app/features/category/models/category-payload.model';
import { CategoryApiService } from '@app/features/category/services/category-api.service';
import { NotificationService } from '@core/notification/notification.service';
import { resolveApiErrorMessage } from '@core/http/utils/api-error';

@Component({
  selector: 'app-category-form-dialog',
  imports: [
    NzButtonModule,
    NzCheckboxModule,
    NzInputModule,
    NzModalModule,
    FontAwesomeModule,
    ReactiveFormsModule,
  ],
  templateUrl: './category-form-dialog.html',
})
export class CategoryFormDialog {
  private readonly categoryApiService = inject(CategoryApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly category = input<Category | null>(null);
  readonly isOpen = input(false);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly faFloppyDisk = faFloppyDisk;
  protected readonly faXmark = faXmark;
  protected readonly categoryForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    active: [true],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.populateForm(this.category());
      }
    });
  }

  protected submit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const category = this.category();
    const payload: CategoryPayload = this.categoryForm.getRawValue();
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
          this.notificationService.success(
            category === null
              ? 'Categoría creada correctamente.'
              : 'Categoría actualizada correctamente.',
          );
          this.saved.emit();
        },
        error: (error: unknown) =>
          this.notificationService.error(
            resolveApiErrorMessage(error, 'No fue posible guardar la categoría.'),
          ),
      });
  }

  protected hasError(controlName: 'title' | 'description'): boolean {
    const control = this.categoryForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private populateForm(category: Category | null): void {
    this.categoryForm.reset(
      category === null
        ? { title: '', description: '', active: true }
        : {
            title: category.title,
            description: category.description,
            active: category.active,
          },
    );
  }
}
